require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Course = require('./models/course');
const { User } = require('./models/user');

const MONGODB_URI = process.env.DB || 'mongodb://127.0.0.1:27017/userlogin';

// Data Banks
const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Rayaan", "Krishna", "Ishaan", "Shaurya", "Sita", "Priya", "Ananya", "Riya", "Aisha", "Neha", "Pooja", "Maya", "Kavya", "Sneha", "Amit", "Rahul", "Vikas", "Suresh", "Ramesh", "Sunil", "Rajesh", "Prakash", "Anita", "Sunita"];
const lastNames = ["Sharma", "Verma", "Gupta", "Patel", "Singh", "Kumar", "Rao", "Das", "Reddy", "Nair", "Iyer", "Joshi", "Bose", "Chatterjee", "Mishra", "Pandey", "Deshmukh", "Chauhan", "Yadav", "Rajput"];

const elementsOfIndianCulture = [
  "Yoga and Meditation", "Ayurveda", "Hindustani Classical Music", "Carnatic Music",
  "Bharatanatyam", "Kathak", "Odissi", "Indian Cuisine", "Vedic Mathematics",
  "Sanskrit Language", "Hindi Language", "Indian Philosophy", "Hindu Mythology",
  "Mughal Architecture", "Dravidian Architecture", "Indian Miniature Painting",
  "Madhubani Art", "Warli Painting", "History of the Mauryan Empire", "The Chola Dynasty",
  "Indian Textiles", "Pottery of India", "Indian Festivals", "Buddhism Origins",
  "Jainism", "Sikhism", "Bollywood History", "Indian Folk Dance", "Sufism in India", "Indian Spices"
];

const levels = ["Introduction to", "Advanced", "Mastering", "The Art of", "History of", "Discovering", "Fundamentals of", "Deep Dive into", "Complete Guide to", "Crash Course on"];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to local DB.");

    console.log("Creating 50 teachers...");
    const teachers = [];
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash('Teacher@123', salt);

    for (let i = 0; i < 50; i++) {
      const fName = getRandomElement(firstNames);
      const lName = getRandomElement(lastNames);
      teachers.push({
        firstName: fName,
        lastName: lName,
        email: `teacher${i}_${Date.now()}@deb.com`,
        password: hashPassword,
        role: 'teacher',
        isVerified: true,
        expertise: getRandomElement(elementsOfIndianCulture)
      });
    }
    
    const insertedTeachers = await User.insertMany(teachers);
    console.log(`Successfully created ${insertedTeachers.length} teachers.`);

    console.log("Generating 10000 courses...");
    
    // Batch processing to prevent memory issues
    const BATCH_SIZE = 1000;
    const TOTAL_COURSES = 10000;

    let coursesInserted = 0;

    for (let batch = 0; batch < TOTAL_COURSES / BATCH_SIZE; batch++) {
      const coursesBatch = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        const topic = getRandomElement(elementsOfIndianCulture);
        const level = getRandomElement(levels);
        const teacher = getRandomElement(insertedTeachers);
        
        // Ensure unique course names per batch to avoid identicals
        const courseName = `${level} ${topic} Masterclass ${batch * BATCH_SIZE + i}`;
        
        // Generate random ratings and reviews
        const numReviews = Math.floor(Math.random() * 5) + 1; // 1 to 5 reviews
        const reviews = [];
        let totalRating = 0;
        
        for (let r = 0; r < numReviews; r++) {
          const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
          totalRating += rating;
          reviews.push({
            user: teacher._id, // Just using teacher as dummy user for reviews
            userName: `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`,
            rating: rating,
            comment: "Amazing course! Highly recommended."
          });
        }
        
        const avgRating = (totalRating / numReviews).toFixed(1);

        coursesBatch.push({
          courseName: courseName,
          category: topic,
          duration: `${Math.floor(Math.random() * 20) + 2} hours`,
          price: Math.floor(Math.random() * 4000) + 500, // Price between 500 and 4500
          description: `A comprehensive course on ${topic} taught by ${teacher.firstName} ${teacher.lastName}. This course covers various aspects of Indian culture and heritage.`,
          learningPoints: [
            `Understand the core principles of ${topic}`,
            `Learn the historical context and evolution`,
            `Practical applications and techniques`
          ],
          thumbnail: `https://loremflickr.com/400/250/india,culture,${topic.split(' ')[0]}?random=${batch * BATCH_SIZE + i}`,
          teacher: teacher._id,
          isPublished: true,
          publishDate: new Date(),
          accessDuration: 365,
          totalEnrollments: Math.floor(Math.random() * 1000),
          reviews: reviews,
          averageRating: parseFloat(avgRating)
        });
      }

      await Course.insertMany(coursesBatch);
      coursesInserted += coursesBatch.length;
      console.log(`Inserted ${coursesInserted} / ${TOTAL_COURSES} courses...`);
    }

    console.log("Successfully inserted 10,000 courses with multiple teachers and ratings!");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    process.exit(0);
  }
}

seed();
