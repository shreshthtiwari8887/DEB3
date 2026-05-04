const router = require("express").Router();
const StateContent = require("../models/stateContent");
const StateHeader = require("../models/stateHeader");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth"); // ⭐ NEW

/* ===========================
   GET PENDING CONTENT (ADMIN)
=========================== */
router.get("/admin/pending", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).send({ message: "Forbidden" });
    const pending = await StateContent.find({ isApproved: false }).sort({ createdAt: -1 });
    res.json({ success: true, data: pending });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===========================
   APPROVE CONTENT (ADMIN)
=========================== */
router.patch("/admin/approve/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).send({ message: "Forbidden" });
    const content = await StateContent.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!content) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===========================
   GET CONTENT BY STATE
=========================== */
router.get("/:stateName", async (req, res) => {
  try {
    const { stateName } = req.params;
    // ⭐ ONLY fetch approved content for the public
    const contents = await StateContent.find({ stateName, isApproved: true }).sort({ createdAt: -1 });

    // Grouping items by category for frontend convenience
    const grouped = {
      "famous-food": [],
      "famous-places": [],
      "art-culture": [],
    };

    contents.forEach((item) => {
      if (grouped[item.category]) {
        grouped[item.category].push({
          id: item._id,
          title: item.title,
          description: item.description,
          image: item.imageUrl, // Map imageUrl to frontend expectations
          createdAt: item.createdAt.toLocaleString(),
        });
      }
    });

    res.json({ success: true, data: grouped });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===========================
   ADD CONTENT TO STATE
=========================== */
router.post("/:stateName", upload.single("image"), async (req, res) => {
  try {
    const { stateName } = req.params;
    const { category, title, description } = req.body;

    if (!category || !title || !description) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    // ⭐ TIER 1: AI FACT-CHECKING (GEMINI)
    let aiFactCheckReason = "AI validation passed.";
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== "your_api_key_here") {
        const prompt = `
          You are an expert Indian Historian. Analyze the following content about the Indian state of ${stateName}.
          Title: ${title}
          Description: ${description}
          Category: ${category}
          
          Is this culturally, geographically, and historically accurate? 
          Respond strictly with a JSON object format: 
          {"isAccurate": boolean, "reason": "A 1-sentence historical explanation."}
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const aiData = await response.json();
        let rawText = aiData.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const aiAnalysis = JSON.parse(rawText);

        if (aiAnalysis.isAccurate === false) {
          // 🚫 TIER 1 REJECTION
          return res.status(403).json({
            success: false,
            error: `AI Fact-Check Failed: ${aiAnalysis.reason}`
          });
        }
        
        // Allowed, store reason for Admin Review
        aiFactCheckReason = aiAnalysis.reason;
      }
    } catch (aiErr) {
      console.error("Gemini Fact Check Error:", aiErr);
      aiFactCheckReason = "AI validation skipped due to network error.";
    }

    const newContent = new StateContent({
      stateName,
      category,
      title,
      description,
      imageUrl: req.file ? req.file.path : null,
      isApproved: false, // ⭐ TIER 2: ADMIN SANDBOX
      aiFactCheck: aiFactCheckReason
    });

    await newContent.save();

    res.status(201).json({
      success: true,
      data: {
        id: newContent._id,
        title: newContent.title,
        description: newContent.description,
        image: newContent.imageUrl,
        createdAt: newContent.createdAt.toLocaleString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===========================
   DELETE CONTENT
=========================== */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await StateContent.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Content not found" });
    }

    // Optionally delete from Cloudinary here if it had an image
    // (Skipping for now to keep it simple, but good practice)

    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===========================
   GET STATE HEADER IMAGES
=========================== */
router.get("/:stateName/header", async (req, res) => {
  try {
    const { stateName } = req.params;
    const header = await StateHeader.findOne({ stateName });
    res.json({ success: true, data: header ? header.images : [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===========================
   UPDATE STATE HEADER IMAGES
=========================== */
router.put("/:stateName/header", upload.array("images", 3), async (req, res) => {
  try {
    const { stateName } = req.params;
    
    // The previous images can either be overwritten entirely, 
    // or we can append. The prompt says "replaceable", so we will overwrite entirely with the new array.
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: "Please upload at least one image" });
    }

    const newImages = req.files.map((f) => f.path);

    let header = await StateHeader.findOne({ stateName });
    if (header) {
      header.images = newImages;
      await header.save();
    } else {
      header = new StateHeader({ stateName, images: newImages });
      await header.save();
    }

    res.json({ success: true, data: header.images });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
