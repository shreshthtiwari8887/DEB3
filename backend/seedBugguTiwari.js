require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { User } = require("./models/user");
const Course = require("./models/course");
const connection = require("./db");

const seedBugguTiwari = async () => {
  try {
    await connection();

    // 1. Create Teacher Buggu Tiwari
    const salt = await bcrypt.genSalt(Number(process.env.SALT || 10));
    const hashPassword = await bcrypt.hash("password123", salt);

    let teacher = await User.findOne({ email: "buggu@example.com" });
    if (teacher) {
      console.log("Teacher already exists, skipping creation...");
    } else {
      teacher = new User({
        firstName: "Buggu",
        lastName: "Tiwari",
        email: "buggu@example.com",
        password: hashPassword,
        role: "teacher",
        isVerified: true,
        expertise: "Vedic Sciences & Ancient Mathematics",
        experience: "15+ Years",
        bio: "Specialist in ancient Indian calculation methods and astronomical treaties.",
        region: "Varanasi",
        tradition: "Gurukul Parampara",
        teachingStyle: "Interactive & Logical",
        languages: "Hindi, English, Sanskrit",
        coins: 1000
      });
      await teacher.save();
      console.log("Teacher Buggu Tiwari created!");
    }

    // 1.5 Create a Dummy Student for reviews
    let student = await User.findOne({ email: "student@example.com" });
    if (!student) {
      student = new User({
        firstName: "Sample",
        lastName: "Student",
        email: "student@example.com",
        password: hashPassword,
        role: "user"
      });
      await student.save();
      console.log("Sample student created for reviews!");
    }

    // 2. Create Courses
    const coursesData = [
      {
        courseName: "Vedic Mathematics Mastery",
        category: "Mathematics",
        price: 499,
        description: "Learn high-speed calculation methods from the Vedas. Perfect for competitive exams and mental agility.",
        duration: "10 Hours",
        isPublished: true,
        totalEnrollments: 145,
        averageRating: 4.8
      },
      {
        courseName: "Advanced Sanskrit Grammar",
        category: "Language",
        price: 799,
        description: "Deep dive into Panini's Ashtadhyayi and the logic behind the world's most scientific language.",
        duration: "25 Hours",
        isPublished: true,
        totalEnrollments: 82,
        averageRating: 4.2
      },
      {
        courseName: "Ancient Indian Astronomy",
        category: "Science",
        price: 1299,
        description: "Explore the astronomical calculations of Aryabhatta and Bhaskara. Understand the planetary movements.",
        duration: "15 Hours",
        isPublished: true,
        totalEnrollments: 64,
        averageRating: 3.5
      }
    ];

    for (const cData of coursesData) {
      let course = await Course.findOne({ courseName: cData.courseName, teacher: teacher._id });
      if (!course) {
        course = new Course({
          ...cData,
          teacher: teacher._id,
          learningPoints: ["Foundational Logic", "Speed Calculations", "Historical Context"],
          lectures: [
            { lectureTitle: "Introduction", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", lectureDescription: "Welcome to the course." }
          ]
        });

        // 3. Add Reviews for Sentiment Analysis
        const reviews = [
          { user: student._id, userName: "Rahul", rating: 5, comment: "Absolutely brilliant teaching! The methods are so fast.", sentimentScore: 5, sentimentCategory: "Positive" },
          { user: student._id, userName: "Anjali", rating: 5, comment: "I never knew math could be this fun. Truly inspiring.", sentimentScore: 4, sentimentCategory: "Positive" },
          { user: student._id, userName: "Suresh", rating: 4, comment: "Good content, but the video quality could be better.", sentimentScore: 1, sentimentCategory: "Positive" },
          { user: student._id, userName: "Amit", rating: 2, comment: "Very slow pacing, I got bored easily.", sentimentScore: -3, sentimentCategory: "Negative" },
          { user: student._id, userName: "Priya", rating: 3, comment: "Average course. Helpful but some parts are confusing.", sentimentScore: 0, sentimentCategory: "Neutral" },
          { user: student._id, userName: "Vikram", rating: 1, comment: "Total waste of money. The instructor is not clear at all.", sentimentScore: -5, sentimentCategory: "Negative" },
          { user: student._id, userName: "Neha", rating: 5, comment: "Best Vedic Math course on the platform. Highly recommended!", sentimentScore: 6, sentimentCategory: "Positive" }
        ];

        // Assign some reviews to each course
        course.reviews = reviews.sort(() => 0.5 - Math.random()).slice(0, 5);
        
        // Recalculate average
        const total = course.reviews.reduce((sum, r) => sum + r.rating, 0);
        course.averageRating = total / course.reviews.length;

        await course.save();
        console.log(`Course ${cData.courseName} created with reviews!`);
      }
    }

    console.log("\nSeeding completed successfully! 🎉");
    console.log("Email: buggu@example.com");
    console.log("Password: password123");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedBugguTiwari();
