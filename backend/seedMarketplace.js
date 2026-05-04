require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User } = require('./models/user');
const Product = require('./models/product');

const MONGODB_URI = process.env.DB || 'mongodb://127.0.0.1:27017/userlogin';

const categories = ["Handicrafts", "Textiles & Handlooms", "Jewelry", "Paintings & Art", "Home Decor", "Pottery & Ceramics", "Musical Instruments"];

// Specific thumbnail mapping based on category
const categoryImages = {
  "Handicrafts": [
    "https://images.unsplash.com/photo-1584555684042-8822d56a2f02?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60", // Brass/metal art
    "https://images.unsplash.com/photo-1616788344685-2eab248dbfa2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"  // Wooden art
  ],
  "Textiles & Handlooms": [
    "https://images.unsplash.com/photo-1605810730836-9db43ec68297?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60", // Saree/Fabric
    "https://images.unsplash.com/photo-1588698505973-7729cb11598f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"  // Patterned cloth
  ],
  "Jewelry": [
    "https://images.unsplash.com/photo-1611085583191-a3b181a88401?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60", // Gold/Kundan
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"  // Traditional necklace
  ],
  "Paintings & Art": [
    "https://images.unsplash.com/photo-1578301978693-85fa9c026f33?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60", // Canvas painting
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"  // Traditional art
  ],
  "Home Decor": [
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60", // Decorative room
    "https://images.unsplash.com/photo-1505691938895-1758d7bef51a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"  // Wall decor
  ],
  "Pottery & Ceramics": [
    "https://images.unsplash.com/photo-1610701596007-11502861dcfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60", // Clay pots
    "https://images.unsplash.com/photo-1565193910360-1e58988ffdfb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"  // Painted ceramics
  ],
  "Musical Instruments": [
    "https://images.unsplash.com/photo-1558231335-51515bb554db?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60", // Sitar / Strings
    "https://images.unsplash.com/photo-1519967156942-1e9bf893fcbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"  // Drums/Tabla
  ]
};

const cultureProducts = [
  { title: "Authentic Banarasi Silk Saree", basePrice: 4500, category: "Textiles & Handlooms", desc: "A stunning handwoven Banarasi silk saree with intricate zari work, straight from Varanasi." },
  { title: "Hand-painted Madhubani Canvas", basePrice: 1200, category: "Paintings & Art", desc: "Traditional Madhubani art depicting natural scenes, painted with organic colors." },
  { title: "Kashmiri Pashmina Shawl", basePrice: 6000, category: "Textiles & Handlooms", desc: "100% pure, ultra-soft hand-spun Pashmina shawl from the valleys of Kashmir." },
  { title: "Tribal Dhokra Art Figurine", basePrice: 850, category: "Handicrafts", desc: "Antique-style brass tribal figurine made using the traditional lost-wax casting technique." },
  { title: "Kanjeevaram Wedding Silk Saree", basePrice: 8500, category: "Textiles & Handlooms", desc: "Rich and heavy Kanjeevaram silk saree with pure gold zari borders." },
  { title: "Terracotta Decorative Elephant", basePrice: 450, category: "Pottery & Ceramics", desc: "Beautifully carved terracotta elephant, perfect for traditional home decor." },
  { title: "Meenakari Kundan Necklace Set", basePrice: 2500, category: "Jewelry", desc: "Exquisite Rajasthani Meenakari jewelry set with heavy Kundan stones." },
  { title: "Authentic Sitar", basePrice: 12000, category: "Musical Instruments", desc: "Professional grade, hand-crafted wooden sitar for classical Indian music." },
  { title: "Hand-carved Wooden Temple", basePrice: 3500, category: "Home Decor", desc: "Intricately carved wooden mandir/temple for home worship." },
  { title: "Warli Painting Wall Frame", basePrice: 750, category: "Paintings & Art", desc: "Tribal Warli art depicting a village festival, framed in dark wood." },
  { title: "Blue Pottery Serving Bowl", basePrice: 600, category: "Pottery & Ceramics", desc: "Authentic Jaipur blue pottery bowl, hand-painted with floral motifs." },
  { title: "Chikankari Embroidered Kurta", basePrice: 1800, category: "Textiles & Handlooms", desc: "Elegant white cotton kurta with delicate hand-stitched Lucknowi Chikankari embroidery." },
  { title: "Oxidized Silver Jhumkas", basePrice: 350, category: "Jewelry", desc: "Heavy oxidized silver earrings with traditional bell design." },
  { title: "Hand-knotted Kashmiri Carpet", basePrice: 15000, category: "Home Decor", desc: "Luxurious, pure wool hand-knotted carpet with intricate Persian-inspired designs." },
  { title: "Tabla Set (Copper & Wood)", basePrice: 4500, category: "Musical Instruments", desc: "Professional Tabla set with authentic copper bayan and wooden dayan." }
];

const firstNames = ["Rajesh", "Sunita", "Anil", "Meena", "Kavita", "Vikram", "Suresh", "Lakshmi", "Ramesh", "Geeta"];
const lastNames = ["Sharma", "Verma", "Rao", "Iyer", "Patel", "Singh", "Das", "Menon", "Reddy", "Gupta"];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seedMarketplace() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB. Starting Marketplace Seeding with category-specific thumbnails...");

    // 0. Wipe old products
    console.log("Wiping existing products...");
    await Product.deleteMany({});
    
    // We will reuse the existing vendors to avoid cluttering the users table, 
    // or just fetch them if they exist. Let's just create new ones or fetch the previous ones.
    console.log("Fetching previous dummy vendors...");
    let vendorIds = [];
    const existingVendors = await User.find({ email: { $regex: /^vendor.*@deb\.com$/ } });
    
    if (existingVendors.length > 0) {
      vendorIds = existingVendors.map(v => v._id);
      console.log(`Found ${vendorIds.length} existing dummy vendors.`);
    } else {
      console.log("Creating 10 new dummy vendors...");
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash("Vendor@123", salt);

      for (let i = 0; i < 10; i++) {
        const fName = getRandomElement(firstNames);
        const lName = getRandomElement(lastNames);
        
        const newVendor = new User({
          firstName: fName,
          lastName: lName,
          email: `vendor${Date.now()}${i}@deb.com`,
          password: hashPassword,
          role: "vendor",
          shopName: `${fName}'s Authentic Indian Heritage`,
          isVerified: true,
          documentUrl: "mock_document.pdf"
        });

        await newVendor.save();
        vendorIds.push(newVendor._id);
      }
    }

    // 2. Create Products for each vendor
    let productCount = 0;

    for (const vId of vendorIds) {
      // Give each vendor 10-15 products
      const numProducts = getRandomInt(10, 15);
      
      for (let j = 0; j < numProducts; j++) {
        const baseItem = getRandomElement(cultureProducts);
        
        // Add random variance to price (-15% to +15%)
        const priceVariance = baseItem.basePrice * (getRandomInt(-15, 15) / 100);
        const finalPrice = Math.floor(baseItem.basePrice + priceVariance);
        
        // Random rating between 3.5 and 5.0
        const avgRating = (Math.random() * 1.5 + 3.5).toFixed(1);

        // Get proper thumbnail based on category
        const imagesForCategory = categoryImages[baseItem.category] || categoryImages["Handicrafts"];
        const selectedThumbnail = getRandomElement(imagesForCategory);

        const product = new Product({
          vendorId: vId,
          title: `${baseItem.title} - ${getRandomInt(100, 999)}`,
          description: baseItem.desc,
          price: finalPrice,
          category: baseItem.category,
          images: [selectedThumbnail],
          stock: getRandomInt(5, 50),
          isAvailable: true,
          averageRating: parseFloat(avgRating)
        });

        await product.save();
        productCount++;
      }
    }

    console.log(`Successfully seeded ${productCount} authentic cultural products with category-specific thumbnails!`);
  } catch (err) {
    console.error("Seeding Error:", err);
  } finally {
    process.exit(0);
  }
}

seedMarketplace();
