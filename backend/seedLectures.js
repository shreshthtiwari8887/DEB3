require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/course');

const MONGODB_URI = process.env.DB || 'mongodb://127.0.0.1:27017/userlogin';

const dummyLectures = [
  {
    lectureTitle: "Introduction & Overview",
    lectureDescription: "Welcome to the course! In this first lecture, we cover the basics and what you can expect to learn.",
    videoUrl: "https://www.youtube.com/embed/kJQP7kiw5Fk",
    duration: "15:30",
    isPreview: true,
    notes: "Welcome to the course! \n\nKey takeaways:\n- Ensure you have a quiet environment to study.\n- Review the syllabus attached in the resources.\n- Don't hesitate to reach out to your instructor."
  },
  {
    lectureTitle: "Core Concepts Explained",
    lectureDescription: "Diving deep into the fundamental principles that form the foundation of this topic.",
    videoUrl: "https://www.youtube.com/embed/3JZ_D3ELwOQ",
    duration: "45:12",
    isPreview: false,
    notes: "Core Concepts Summary:\n1. Foundation is key.\n2. Practice regularly.\n3. Refer to the supplementary reading materials for a deeper dive."
  },
  {
    lectureTitle: "Advanced Techniques & Conclusion",
    lectureDescription: "We wrap up the course by looking at advanced methodologies and real-world applications.",
    videoUrl: "https://www.youtube.com/embed/2Vv-BfVoq4g",
    duration: "30:00",
    isPreview: false,
    notes: "Advanced Notes:\n- Remember to combine what you learned in module 1 and 2.\n- Review the case studies to see how this works in practice.\n- Congratulations on completing the course!"
  }
];

async function seedLectures() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to local DB.");

    console.log("Updating all courses to include lectures and notes...");

    const result = await Course.updateMany(
      {}, // filter: all courses
      { $set: { lectures: dummyLectures } }
    );

    console.log(`Successfully updated ${result.modifiedCount} courses with lectures and notes!`);
  } catch (error) {
    console.error("Error adding lectures:", error);
  } finally {
    process.exit(0);
  }
}

seedLectures();
