require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/course');
const { User } = require('./models/user');

const elementsOfIndianCulture = [
  "Yoga and Meditation", "Ayurveda", "Hindustani Classical Music", "Carnatic Music",
  "Bharatanatyam", "Kathak", "Odissi", "Indian Cuisine", "Vedic Mathematics",
  "Sanskrit Language", "Hindi Language", "Indian Philosophy", "Hindu Mythology",
  "Mughal Architecture", "Dravidian Architecture", "Indian Miniature Painting",
  "Madhubani Art", "Warli Painting", "History of the Mauryan Empire", "The Chola Dynasty",
  "Indian Textiles", "Pottery of India", "Indian Festivals", "Buddhism Origins",
  "Jainism", "Sikhism", "Bollywood History", "Indian Folk Dance"
];

const levels = ["Introduction to", "Advanced", "Mastering", "The Art of", "History of", "Discovering", "Fundamentals of", "Deep Dive into"];

const generateCourses = (teacherId, numCourses) => {
  const courses = [];
  for (let i = 0; i < numCourses; i++) {
    const topic = elementsOfIndianCulture[Math.floor(Math.random() * elementsOfIndianCulture.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const courseName = `${level} ${topic} ${i + 1}`;
    
    courses.push({
      courseName: courseName,
      category: topic,
      duration: `${Math.floor(Math.random() * 20) + 2} hours`,
      price: Math.floor(Math.random() * 4000) + 500, // Price between 500 and 4500
      description: `A comprehensive course on ${topic}. This course covers various aspects of Indian culture and heritage.`,
      learningPoints: [
        `Understand the core principles of ${topic}`,
        `Learn the historical context and evolution`,
        `Practical applications and techniques`
      ],
      thumbnail: `https://loremflickr.com/400/250/india,culture,${topic.split(' ')[0]}?random=${i}`, // Real image related to Indian culture
      teacher: teacherId,
      isPublished: true,
      publishDate: new Date(),
      accessDuration: 365,
      totalEnrollments: Math.floor(Math.random() * 1000),
      averageRating: (Math.random() * 2 + 3).toFixed(1) // Rating between 3.0 and 5.0
    });
  }
  return courses;
};

mongoose.connect(process.env.DB).then(async () => {
  try {
    // Make sure we have a teacher (admin user)
    let teacher = await User.findOne({ email: 'admin@deb.com' });
    if (!teacher) {
      console.log("Admin user not found. Please run seedAdmin.js first.");
      process.exit(1);
    }

    console.log("Clearing existing courses...");
    await Course.deleteMany({});

    console.log("Generating 1000 courses...");
    const coursesToInsert = generateCourses(teacher._id, 1000);

    console.log("Inserting courses into the database...");
    await Course.insertMany(coursesToInsert);
    
    console.log("Successfully inserted 1000 courses related to Indian Culture!");
  } catch (err) {
    console.error("Error seeding courses:", err);
  } finally {
    process.exit(0);
  }
}).catch(err => {
    console.error("Database connection failed:", err);
    process.exit(1);
});
