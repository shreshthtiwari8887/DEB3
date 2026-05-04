require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/product");
const { User } = require("./models/user"); // Assume we can grab some users or just mock user IDs

const MONGODB_URI = process.env.DB || "mongodb://127.0.0.1:27017/userlogin";

const sampleReviews = [
  { rating: 5, comment: "Absolutely beautiful craftsmanship! The detail is incredible." },
  { rating: 5, comment: "Looks exactly like the pictures. Very authentic and high quality." },
  { rating: 4, comment: "Great product, but delivery was a bit slow. Still love it." },
  { rating: 4, comment: "Very nice piece of art. Fits perfectly in my living room." },
  { rating: 5, comment: "I am amazed by the cultural authenticity. Highly recommend this vendor." },
  { rating: 3, comment: "It's decent, but smaller than I expected. Good quality though." },
  { rating: 2, comment: "The color is slightly different from what was shown. A bit disappointed." },
  { rating: 5, comment: "A perfect gift! My family loved the traditional touch." },
  { rating: 4, comment: "Good value for money. Represents Indian heritage beautifully." },
  { rating: 5, comment: "Exceptional work! Will definitely buy more items from this collection." },
  { rating: 1, comment: "Arrived slightly damaged. Packaging needs to be improved." },
  { rating: 5, comment: "Stunning piece! The handcrafted details are flawless." }
];

const firstNames = ["Aarav", "Priya", "Rahul", "Sneha", "Vikram", "Anjali", "Rohan", "Meera", "Karan", "Neha", "Arjun", "Kavya"];

async function seedReviews() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB. Seeding reviews...");

    // We'll just generate a dummy ObjectId for the review 'user' field to keep it simple,
    // since we don't strictly need real users to display reviews.
    const dummyUserId = new mongoose.Types.ObjectId();

    const products = await Product.find({});
    
    for (let product of products) {
      // Generate 10 random reviews from the sample array
      const shuffledReviews = sampleReviews.sort(() => 0.5 - Math.random()).slice(0, 10);
      
      const newReviews = shuffledReviews.map((rev, index) => {
        return {
          user: new mongoose.Types.ObjectId(), // Random user ID for the review
          userName: firstNames[index % firstNames.length],
          rating: rev.rating,
          comment: rev.comment,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)) // Random past date
        };
      });

      product.reviews = newReviews;
      
      // Calculate average rating
      const totalRating = newReviews.reduce((sum, r) => sum + r.rating, 0);
      product.averageRating = parseFloat((totalRating / newReviews.length).toFixed(1));

      await product.save();
    }

    console.log(`Successfully seeded 10 reviews each for ${products.length} products!`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

seedReviews();
