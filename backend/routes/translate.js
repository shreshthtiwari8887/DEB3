const router = require("express").Router();
const translate = require("translate-google");

// Very simple in-memory cache for API translations to avoid rate limits
// Key: "text-toLng", Value: "translated_text"
const translationCache = new Map();

router.post("/", async (req, res) => {
  try {
    const { text, to } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: "No text provided" });
    }

    if (!to || to === "en") {
      return res.json({ success: true, original: text, translatedText: text });
    }

    const cacheKey = `${text}-${to}`;
    if (translationCache.has(cacheKey)) {
      return res.json({ success: true, original: text, translatedText: translationCache.get(cacheKey) });
    }

    const result = await translate(text, { to });
    
    translationCache.set(cacheKey, result);
    res.json({ success: true, original: text, translatedText: result });

  } catch (err) {
    console.error("Translation error:", err.message);
    // If it fails (e.g., rate limit), fail gracefully and return the original text
    res.json({ success: false, original: req.body.text, translatedText: req.body.text });
  }
});

// Endpoint that translates an array of texts for batch operations
router.post("/batch", async (req, res) => {
  try {
    const { texts, to } = req.body;
    
    if (!Array.isArray(texts)) {
      return res.status(400).json({ success: false, error: "texts must be an array" });
    }

    if (!to || to === "en") {
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
        const cacheKey = `${text}-${to}`;
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
        // Send ALL uncached texts in a single Google Translate API request!
        const objResult = await translate(uncachedTexts, { to });
        
        // translate-google returns an object {0: '...', 1: '...'} or an array
        const translatedArray = Array.isArray(objResult) ? objResult : Object.values(objResult);

        uncachedTexts.forEach((text, idx) => {
          const translatedText = translatedArray[idx] || text;
          translationCache.set(`${text}-${to}`, translatedText);
          results[uncachedIndices[idx]] = translatedText;
        });
      } catch (e) {
        console.error("translate-google bulk error:", e.message);
        // gracefully fallback to English for the uncached if rate limited
        uncachedTexts.forEach((text, idx) => {
          results[uncachedIndices[idx]] = text;
        });
      }
    }

    const translatedTexts = results;

    res.json({ success: true, translatedTexts });

  } catch (err) {
    console.error("Batch Translation error:", err.message);
    res.json({ success: false, translatedTexts: req.body.texts }); // graceful fallback
  }
});

module.exports = router;
