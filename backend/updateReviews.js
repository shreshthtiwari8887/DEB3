require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/course');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

const MONGODB_URI = process.env.DB || 'mongodb://127.0.0.1:27017/userlogin';

// Expanded diverse pool of realistic student reviews
const reviewPool = [
  { rating: 5, comment: "Absolutely phenomenal course. The instructor explained everything clearly and the notes were very helpful!" },
  { rating: 5, comment: "Highly recommended! I learned so much about the culture." },
  { rating: 4, comment: "Great content, but I wish the videos were slightly longer. Still learned a lot." },
  { rating: 4, comment: "Very good overview. The instructor was knowledgeable." },
  { rating: 3, comment: "It was okay. A bit slow at times but decent information overall." },
  { rating: 3, comment: "Average course. The notes were okay but the video quality could be better." },
  { rating: 2, comment: "I had a hard time following along. The audio was terrible and kept cutting out." },
  { rating: 2, comment: "Not what I expected. The curriculum was too basic." },
  { rating: 1, comment: "Terrible course. Do not waste your money or coins on this." },
  { rating: 1, comment: "Extremely disappointing. The audio is bad and the instructor seems unprepared." },
  { rating: 5, comment: "Loved every minute of it! Such a deep dive into Indian heritage." },
  { rating: 4, comment: "Solid foundation for beginners. Will take the advanced course next." },
  { rating: 3, comment: "Neutral feelings. It's not bad, but not amazing either." },
  { rating: 5, comment: "The best course I have taken on this platform!" },
  { rating: 5, comment: "The structure of the course is flawless. Really appreciate the effort put into the notes." },
  { rating: 4, comment: "Good course. I liked the practical examples." },
  { rating: 2, comment: "The instructor spoke too fast and I couldn't understand some parts." },
  { rating: 4, comment: "Worth the time. The demo videos were a good representation of the full course." },
  { rating: 5, comment: "I can't recommend this enough. The historical context provided was mind-blowing." },
  { rating: 3, comment: "It's fine for a beginner, but if you already know the basics, skip it." },
  { rating: 1, comment: "I asked a question and never got an answer. Bad support." },
  { rating: 4, comment: "Really enjoyed the lectures. The pacing is perfect." },
  { rating: 5, comment: "A masterpiece! The teacher is a true guru." },
  { rating: 2, comment: "The video resolution was very low, making it hard to see the board." },
  { rating: 3, comment: "Not bad, but I've seen better tutorials on YouTube for free." }
];

const firstNames = ["Amit", "Priya", "Rahul", "Sneha", "Vikas", "Neha", "Rohan", "Pooja", "Arjun", "Ananya", "Vikram", "Sunita", "Raj", "Kavya", "Suresh"];
const lastNames = ["Sharma", "Verma", "Gupta", "Patel", "Singh", "Kumar", "Rao", "Das", "Reddy", "Nair", "Iyer", "Joshi", "Bose", "Menon", "Chauhan"];
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function updateReviews() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to local DB.");

    console.log("Fetching courses to inject 10+ reviews each...");
    const courses = await Course.find();
    
    let updatedCount = 0;

    for (let course of courses) {
      // Generate 10 to 15 random reviews for this course
      const numReviews = Math.floor(Math.random() * 6) + 10;
      const newReviews = [];
      let totalRating = 0;

      for (let i = 0; i < numReviews; i++) {
        const randomReview = getRandomElement(reviewPool);
        totalRating += randomReview.rating;
        
        // Analyze sentiment
        const sentResult = sentiment.analyze(randomReview.comment);
        let sentCat = "Neutral";
        if (sentResult.score > 0) sentCat = "Positive";
        else if (sentResult.score < 0) sentCat = "Negative";

        newReviews.push({
          user: new mongoose.Types.ObjectId(), // Dummy user ID just for the record
          userName: `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`,
          rating: randomReview.rating,
          comment: randomReview.comment,
          sentimentScore: sentResult.score,
          sentimentCategory: sentCat,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)) // random past date
        });
      }

      course.reviews = newReviews;
      course.averageRating = parseFloat((totalRating / numReviews).toFixed(1));
      
      await course.save();
      updatedCount++;
    }

    console.log(`Successfully injected 10+ diverse reviews into ${updatedCount} courses!`);
  } catch (error) {
    console.error("Error updating reviews:", error);
  } finally {
    process.exit(0);
  }
}

updateReviews();
