require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product');

const MONGODB_URI = process.env.DB || 'mongodb://127.0.0.1:27017/userlogin';

// Reliable Working Images
const categoryImages = {
  "Handicrafts": [
    "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
  ],
  "Textiles & Handlooms": [
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
  ],
  "Jewelry": [
    "https://images.unsplash.com/photo-1611085583191-a3b181a88401?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
  ],
  "Paintings & Art": [
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
  ],
  "Home Decor": [
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
  ],
  "Pottery & Ceramics": [
    "https://images.unsplash.com/photo-1610701596007-11502861dcfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
  ],
  "Musical Instruments": [
    "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
  ]
};

async function fixImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB. Fixing broken images...");

    const products = await Product.find({});
    let updatedCount = 0;

    for (let product of products) {
      const workingImage = categoryImages[product.category]?.[0] || categoryImages["Handicrafts"][0];
      
      product.images = [workingImage];
      await product.save();
      updatedCount++;
    }

    console.log(`Successfully fixed images for ${updatedCount} products!`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

fixImages();
