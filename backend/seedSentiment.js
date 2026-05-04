require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/course');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

const MONGODB_URI = process.env.DB || 'mongodb://127.0.0.1:27017/userlogin';

async function seedSentiment() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to local DB.");

    console.log("Analyzing sentiment for all existing reviews...");

    const courses = await Course.find();
    let updatedCourses = 0;

    for (let course of courses) {
      if (course.reviews && course.reviews.length > 0) {
        let changed = false;
        
        course.reviews.forEach(review => {
          if (!review.sentimentCategory || review.sentimentCategory === "Neutral") {
            const result = sentiment.analyze(review.comment);
            review.sentimentScore = result.score;
            if (result.score > 0) review.sentimentCategory = "Positive";
            else if (result.score < 0) review.sentimentCategory = "Negative";
            else review.sentimentCategory = "Neutral";
            changed = true;
          }
        });

        if (changed) {
          await course.save();
          updatedCourses++;
        }
      }
    }

    console.log(`Successfully updated sentiment for reviews in ${updatedCourses} courses.`);
  } catch (error) {
    console.error("Error updating sentiment:", error);
  } finally {
    process.exit(0);
  }
}

seedSentiment();
