require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/course');

const MONGODB_URI = process.env.DB || 'mongodb://127.0.0.1:27017/userlogin';

const topicVideos = {
  "Yoga and Meditation": "https://www.youtube.com/embed/v7AYKMP6rOE",
  "Ayurveda": "https://www.youtube.com/embed/QxNfXyL7DZY",
  "Hindustani Classical Music": "https://www.youtube.com/embed/0B2bU52u_X8",
  "Carnatic Music": "https://www.youtube.com/embed/uG7bJgS_k6I",
  "Bharatanatyam": "https://www.youtube.com/embed/6vHqE9zU0xY",
  "Kathak": "https://www.youtube.com/embed/8-639xWk0_A",
  "Odissi": "https://www.youtube.com/embed/Pj15b6N-v_g",
  "Indian Cuisine": "https://www.youtube.com/embed/R28f5K1z18Q",
  "Vedic Mathematics": "https://www.youtube.com/embed/zO-sQ13U92s",
  "Sanskrit Language": "https://www.youtube.com/embed/5T5k98fXk_A",
  "Hindi Language": "https://www.youtube.com/embed/wzXGz8Txg1g",
  "Indian Philosophy": "https://www.youtube.com/embed/6T2B_Q_XQ28",
  "Hindu Mythology": "https://www.youtube.com/embed/L1R8fN_o55Y",
  "Mughal Architecture": "https://www.youtube.com/embed/y5gRj3S5k_E",
  "Dravidian Architecture": "https://www.youtube.com/embed/QYp6y8_PzVw",
  "Indian Miniature Painting": "https://www.youtube.com/embed/N-Z_M7z2SJQ",
  "Madhubani Art": "https://www.youtube.com/embed/u3F3_8bV3gE",
  "Warli Painting": "https://www.youtube.com/embed/1v0S_zQ_V60",
  "History of the Mauryan Empire": "https://www.youtube.com/embed/7X88D1h4gGk",
  "The Chola Dynasty": "https://www.youtube.com/embed/G6j5u9Q_J0c",
  "Indian Textiles": "https://www.youtube.com/embed/R5r2M6x_B5k",
  "Pottery of India": "https://www.youtube.com/embed/4yZ4gN_Q_A0",
  "Indian Festivals": "https://www.youtube.com/embed/V6X_zN9k10A",
  "Buddhism Origins": "https://www.youtube.com/embed/Zz_xN9b6y_k",
  "Jainism": "https://www.youtube.com/embed/5_M5rT8X7Bw",
  "Sikhism": "https://www.youtube.com/embed/5_Z_2-7_n9w",
  "Bollywood History": "https://www.youtube.com/embed/1_2_V_1_z9A",
  "Indian Folk Dance": "https://www.youtube.com/embed/9X5z0o7Y1_g",
  "Sufism in India": "https://www.youtube.com/embed/5_2_Q_1_v8Q",
  "Indian Spices": "https://www.youtube.com/embed/3_7_A_1_b4C"
};

const defaultVideo = "https://www.youtube.com/embed/kJQP7kiw5Fk";

async function updateLectures() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to local DB.");

    console.log("Fetching all courses...");
    
    // Instead of find() loading 11,000 docs into memory, we can use bulkWrite or just updateMany per topic.
    // Since there are only 30 topics, running 30 updateMany commands is extremely fast!

    const topics = Object.keys(topicVideos);
    let totalModified = 0;

    for (const topic of topics) {
      const videoUrl = topicVideos[topic];
      
      const result = await Course.updateMany(
        { category: topic },
        { 
          $set: { 
            "lectures.$[].videoUrl": videoUrl 
          } 
        }
      );
      
      totalModified += result.modifiedCount;
      console.log(`Updated ${result.modifiedCount} courses in category: ${topic}`);
    }

    // Update any courses that might not have matched the exactly 30 categories
    const resultDefault = await Course.updateMany(
      { category: { $nin: topics } },
      { 
        $set: { 
          "lectures.$[].videoUrl": defaultVideo 
        } 
      }
    );
    totalModified += resultDefault.modifiedCount;
    console.log(`Updated ${resultDefault.modifiedCount} courses with default video.`);

    console.log(`Successfully updated YouTube links for ${totalModified} courses!`);
  } catch (error) {
    console.error("Error updating lectures:", error);
  } finally {
    process.exit(0);
  }
}

updateLectures();
