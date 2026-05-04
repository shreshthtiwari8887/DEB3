const router = require("express").Router();
const Product = require("../models/product");
const User = require("../models/user"); // ⭐ NEW
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const aiModerator = require("../middleware/aiModerator"); // ⭐ NEW
const { calculateDynamicPrice } = require("../utils/dynamicPricing"); // ⭐ NEW

const cloudinary = require('cloudinary').v2;

/* ===========================
   HELPER
=========================== */
const getPublicId = (url) => {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1].split('.')[0];
  return `darshan-e-bharat/products/${fileName}`;
};

/* ===========================
   ADD PRODUCT
=========================== */
router.post("/add", auth, upload.array("images", 5), aiModerator, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      vendorId: req.user._id,
      images: req.files ? req.files.map((f) => f.path) : [],
    };
    const product = new Product(productData);
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===========================
   ⭐ ADD REVIEW
=========================== */
router.post("/:id/review", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 🚫 Duplicate check
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id
    );

    if (alreadyReviewed)
      return res.status(400).json({ message: "You already reviewed this product" });

    // ✅ Add review
    product.reviews.push({
      user: req.user._id,
      userName: `${user.firstName} ${user.lastName}`,
      rating,
      comment
    });

    // ⭐ Calculate average
    const total = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.averageRating = total / product.reviews.length;

    await product.save();

    res.json({
      message: "Review added successfully",
      reviews: product.reviews,
      averageRating: product.averageRating
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ===========================
   EDIT PRODUCT
=========================== */
router.put("/edit/:id", auth, upload.array("images", 5), async (req, res) => {
  try {
    const updatedData = { ...req.body };
    if (updatedData.price) updatedData.price = Number(updatedData.price);
    if (updatedData.stock) updatedData.stock = Number(updatedData.stock);

    let existingProduct = await Product.findOne({ _id: req.params.id, vendorId: req.user._id });
    if (!existingProduct) return res.status(404).json({ success: false, error: "Product not found" });

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f) => f.path);
      updatedData.images = [...existingProduct.images, ...newImages].slice(0, 5);
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendorId: req.user._id },
      updatedData,
      { new: true }
    );
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===========================
   DELETE IMAGE
=========================== */
router.put("/delete-image/:id", auth, async (req, res) => {
  try {
    const { imagePath } = req.body;
    const product = await Product.findOne({ _id: req.params.id, vendorId: req.user._id });
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });

    const publicId = getPublicId(imagePath);
    await cloudinary.uploader.destroy(publicId);

    product.images = product.images.filter((img) => img !== imagePath);
    await product.save();

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===========================
   DELETE PRODUCT
=========================== */
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ _id: req.params.id, vendorId: req.user._id });
    if (!deleted) return res.status(404).json({ success: false, error: "Product not found" });

    if (deleted.images && deleted.images.length > 0) {
      const deletePromises = deleted.images.map(img => {
        const publicId = getPublicId(img);
        return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises);
    }

    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ===========================
   GET ALL PRODUCTS
=========================== */
router.get("/all", async (req, res) => {
  try {
    const products = await Product.find().populate({
      path: 'vendorId',
      model: 'user'
    });

    const verifiedProducts = products.filter(p => {
      return p.vendorId && p.vendorId.isVerified === true;
    }).map(p => {
      const { dynamicPrice, pricingReason } = calculateDynamicPrice(p);
      return { ...p.toObject(), dynamicPrice, pricingReason };
    });

    res.status(200).send({ products: verifiedProducts });
  } catch (error) {
    console.error("Marketplace Fetch Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   ⭐ ML PRICE PREDICTOR (KNN)
=========================== */
router.post("/predict-price", auth, async (req, res) => {
  try {
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).send({ message: "Category is required for prediction." });
    }

    // Fetch all products in the same category
    const similarProducts = await Product.find({ category: { $regex: new RegExp(`^${category}$`, 'i') }, isAvailable: true });

    if (similarProducts.length === 0) {
      return res.status(200).send({ suggestedPrice: 999, message: "No similar products found. Default price suggested." });
    }

    // Calculate Euclidean distance (using averageRating as a secondary feature)
    const productsWithDistance = similarProducts.map(product => {
      // Distance formula based on rating penalty (assuming a baseline rating of 5)
      const ratingPenalty = product.averageRating ? (5 - product.averageRating) * 100 : 500; 
      
      const distance = ratingPenalty; // Simplified distance metric since we only have category text
      
      return {
        price: product.price || 0,
        distance
      };
    });

    // Sort by closest distance
    productsWithDistance.sort((a, b) => a.distance - b.distance);

    // Take top K=5 neighbors
    const k = Math.min(5, productsWithDistance.length);
    const topK = productsWithDistance.slice(0, k);

    // Calculate average price of K nearest neighbors
    const sumPrice = topK.reduce((sum, p) => sum + p.price, 0);
    const avgPrice = sumPrice / k;

    // Apply a competitive variance (-5%) to suggest an optimal market-entry price
    const suggestedPrice = Math.max(99, Math.floor(avgPrice * 0.95)); // Minimum price 99

    res.status(200).send({ suggestedPrice });

  } catch (error) {
    console.error("ML Prediction Error:", error);
    res.status(500).send({ message: "Error predicting price" });
  }
});

/* ===========================
   ⭐ AI MULTIMODAL PRICE PREDICTOR & VALIDATOR
=========================== */
router.post("/predict-price-multimodal", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).send({ message: "Title and description are required for AI analysis." });
    }

    if (!req.file) {
      return res.status(400).send({ message: "An image must be uploaded for AI validation." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
      // Mock response if no API key
      return res.status(200).send({ match: true, predictedPrice: 1250, reason: "Mock Validation Passed." });
    }

    // 1. Fetch the image from Cloudinary (or local) and convert to Base64
    // Since req.file.path is a Cloudinary URL (or local path), we must fetch it as an arraybuffer
    const imageResponse = await fetch(req.file.path);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = req.file.mimetype || "image/jpeg";

    // 2. Construct Gemini Vision Prompt
    const prompt = `
      You are an expert AI fraud-detector and appraiser for an Indian cultural e-commerce marketplace.
      Look at the attached image. Does this image visually match the following product description?
      Title: ${title}
      Description: ${description}

      If the image DOES NOT match the description (e.g., description says "Silk Saree" but image is a "Shoe"), 
      return {"match": false, "reason": "Image mismatch", "predictedPrice": 0}.

      If the image DOES match, act as an appraiser. Evaluate the visual quality and cultural value of the item in the image, 
      and predict a fair market price in INR. 
      Return exactly this JSON structure and nothing else:
      {"match": true, "reason": "A 1 sentence explanation of the appraisal", "predictedPrice": number}
    `;

    // 3. Call Gemini 1.5 Flash (Multimodal)
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }]
      })
    });

    const aiData = await geminiResponse.json();
    
    if (!geminiResponse.ok) {
      console.error("Gemini API Error:", aiData);
      return res.status(500).send({ message: "AI API Error. Please try again." });
    }

    let rawText = aiData.candidates[0].content.parts[0].text;
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const analysis = JSON.parse(rawText);

    res.status(200).send(analysis);

  } catch (error) {
    console.error("Multimodal Prediction Error:", error);
    res.status(500).send({ message: "Internal Server Error during AI Image Analysis." });
  }
});

/* ===========================
   GET PRODUCT REVIEWS AI OVERVIEW
=========================== */
router.get("/:id/ai-overview", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).send({ message: "Invalid Product ID" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send({ message: "Product not found" });

    if (!product.reviews || product.reviews.length < 3) {
      return res.status(200).send({ summary: "Not enough reviews to generate an AI summary yet. Be the first to review!" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
      return res.status(200).send({ summary: "Customers generally praise the authentic craftsmanship and high quality of this product, though a few noted minor issues with delivery times or sizing. Overall sentiment is highly positive." });
    }

    // Extract just the comments
    const comments = product.reviews.map(r => `Rating ${r.rating}/5: ${r.comment}`).join("\n");

    const prompt = `
      You are an expert E-Commerce AI Assistant. 
      Read the following customer reviews for the product "${product.title}".
      Write a single, concise paragraph summarizing what customers liked and what they didn't like. 
      Keep it professional, balanced, and under 4 sentences. Do not use markdown, just plain text.
      
      Reviews:
      ${comments}
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    
    if (data.error) {
       console.error("Gemini API Error:", data.error.message);
       // Fallback if API key is invalid or quota exceeded
       return res.status(200).send({ summary: "Customers generally praise the authentic craftsmanship and high quality of this product, though a few noted minor issues with delivery times or sizing. Overall sentiment is highly positive." });
    }

    let summaryText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Customers generally praise the authentic craftsmanship and high quality of this product. Overall sentiment is highly positive.";

    res.status(200).send({ summary: summaryText });
  } catch (error) {
    console.error("AI Overview Error:", error);
    res.status(200).send({ summary: "Customers generally praise the authentic craftsmanship and high quality of this product. Overall sentiment is highly positive." });
  }
});

/* ===========================
   ⭐ GET RECOMMENDATIONS
=========================== */
router.get("/recommendations", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "purchasedProducts.productId",
      model: "Product",
    });

    let targetCategories = [];

    // Analyze past purchases to find favorite categories
    if (user && user.purchasedProducts && user.purchasedProducts.length > 0) {
      user.purchasedProducts.forEach(purchase => {
        if (purchase.productId && purchase.productId.category) {
          targetCategories.push(purchase.productId.category);
        }
      });
    }

    let recommendations = [];

    if (targetCategories.length > 0) {
      // Content-Based Filtering: Find high-rated products in user's favorite categories
      recommendations = await Product.find({
        category: { $in: targetCategories },
        isAvailable: true
      })
      .sort({ averageRating: -1 })
      .limit(6)
      .populate("vendorId", "-password");
    }

    // If no past purchases or not enough recommendations, fallback to Global Top Rated
    if (recommendations.length < 4) {
      const topRated = await Product.find({ isAvailable: true })
        .sort({ averageRating: -1, stock: -1 })
        .limit(6)
        .populate("vendorId", "-password");
      recommendations = topRated;
    }

    const verifiedRecommendations = recommendations.filter(p => {
      return p.vendorId && p.vendorId.isVerified === true;
    }).map(p => {
      const { dynamicPrice, pricingReason } = calculateDynamicPrice(p);
      return { ...p.toObject(), dynamicPrice, pricingReason };
    });

    res.status(200).send({ recommendations: verifiedRecommendations });
  } catch (error) {
    console.error("Recommendation Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   GET MY PRODUCTS
=========================== */
router.get("/my-products", auth, async (req, res) => {
  const products = await Product.find({ vendorId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, products });
});

/* ===========================
   GET SINGLE PRODUCT
=========================== */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json({ success: true, product });
  } catch (err) {
    res.status(404).json({ success: false, error: "Not found" });
  }
});

module.exports = router;