require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product');

const MONGODB_URI = process.env.DB || 'mongodb://127.0.0.1:27017/userlogin';

// Groups of highly relevant, specific Unsplash images based on keywords
const keywordImageGroups = {
  "saree": [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1583391733958-6115915d31d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ],
  "kurta": [
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1596461404886-905d46bc9e34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ],
  "dhokra": [
    "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1542039233-a6cd5ebc3df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1590845947376-28dbdc6ee265?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ],
  "terracotta": [
    "https://images.unsplash.com/photo-1610701596007-11502861dcfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1565193566173-7a0cb3d16233?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1595183981881-39f28d84a7ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ],
  "necklace": [
    "https://images.unsplash.com/photo-1599643478514-4a888f61871e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ],
  "earring": [
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ],
  "bangle": [
    "https://images.unsplash.com/photo-1611085583191-a3b181a88401?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1574542614995-1e0e85f543dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ],
  "painting": [
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1580136608260-4ebf15facb45?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ],
  "flute": [
    "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600868213606-25edb5ccdc5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ],
  "pottery": [
    "https://images.unsplash.com/photo-1565193566173-7a0cb3d16233?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1610701596007-11502861dcfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1578301978693-85fa9c026f33?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ],
  "wood": [
    "https://images.unsplash.com/photo-1541514751722-e30e69cb4520?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1611085583191-a3b181a88401?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ]
};

// Fallback image group
const defaultImageGroup = [
  "https://images.unsplash.com/photo-1584555684042-8822d56a2f02?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1605810730836-9db43ec68297?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1588698505973-7729cb11598f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
];

async function fixSpecificImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB. Applying specific relevant images for galleries...");

    const products = await Product.find({});
    let updatedCount = 0;

    for (let product of products) {
      let selectedImages = null;
      const titleLower = product.title.toLowerCase();

      // Search for keywords in the title
      for (const [keyword, urls] of Object.entries(keywordImageGroups)) {
        if (titleLower.includes(keyword)) {
          selectedImages = urls;
          break; // Stop at first match
        }
      }

      // If no keyword matches, use the fallback
      if (!selectedImages) {
        selectedImages = defaultImageGroup;
      }
      
      product.images = selectedImages;
      await product.save();
      updatedCount++;
    }

    console.log(`Successfully assigned image galleries to ${updatedCount} products!`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

fixSpecificImages();
