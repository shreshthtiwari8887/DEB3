const router = require("express").Router();
const translate = require("translate-google");

// Very simple in-memory cache for API translations to avoid rate limits
// Key: "text-toLng", Value: "translated_text"
const translationCache = new Map();

router.post("/", async (req, res) => {
  try {
    const { text, to } = req.body;
    const targetLang = to ? to.split("-")[0] : "en";

    if (!text) {
      return res.status(400).json({ success: false, error: "No text provided" });
    }

    if (!targetLang || targetLang === "en") {
      return res.json({ success: true, original: text, translatedText: text });
    }

    const cacheKey = `${text}-${targetLang}`;
    if (translationCache.has(cacheKey)) {
      return res.json({ success: true, original: text, translatedText: translationCache.get(cacheKey) });
    }

    console.log(`Translating: "${text.substring(0, 20)}..." to ${targetLang}`);
    const result = await translate(text, { from: "en", to: targetLang });
    
    translationCache.set(cacheKey, result);
    res.json({ success: true, original: text, translatedText: result });

  } catch (err) {
    console.error("Translation error:", err.message);
    res.json({ success: false, original: req.body.text, translatedText: req.body.text });
  }
});

// Endpoint that translates an array of texts for batch operations
router.post("/batch", async (req, res) => {
  try {
    const { texts, to } = req.body;
    const targetLang = to ? to.split("-")[0] : "en";
    
    if (!Array.isArray(texts)) {
      return res.status(400).json({ success: false, error: "texts must be an array" });
    }

    if (!targetLang || targetLang === "en") {
      return res.json({ success: true, translatedTexts: texts });
    }

    const uncachedTexts = [];
    const uncachedIndices = [];
    const results = new Array(texts.length);

    // Filter out cached translations
    texts.forEach((text, i) => {
      if (!text) {
        results[i] = text;
      } else {
        const cacheKey = `${text}-${targetLang}`;
        if (translationCache.has(cacheKey)) {
          results[i] = translationCache.get(cacheKey);
        } else {
          uncachedTexts.push(text);
          uncachedIndices.push(i);
        }
      }
    });

    if (uncachedTexts.length > 0) {
      try {
        console.log(`Batch translating ${uncachedTexts.length} items from en to ${targetLang}`);
        const objResult = await translate(uncachedTexts, { from: "en", to: targetLang });
        
        const translatedArray = Array.isArray(objResult) ? objResult : Object.values(objResult);

        uncachedTexts.forEach((text, idx) => {
          const translatedText = translatedArray[idx] || text;
          translationCache.set(`${text}-${targetLang}`, translatedText);
          results[uncachedIndices[idx]] = translatedText;
        });
      } catch (e) {
        console.error("Batch translation failed:", e.message);
        uncachedTexts.forEach((text, idx) => {
          results[uncachedIndices[idx]] = text;
        });
      }
    }

    res.json({ success: true, translatedTexts: results });

  } catch (err) {
    console.error("Batch Translation error:", err.message);
    res.json({ success: false, translatedTexts: req.body.texts });
  }
});

module.exports = router;
