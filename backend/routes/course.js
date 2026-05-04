const router = require("express").Router();
const mongoose = require("mongoose");
const Course = require("../models/course");
const { User } = require("../models/user");
const auth = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

/* ✅ USE CLOUDINARY INSTEAD OF LOCAL MULTER */
const upload = require("../middleware/upload");
const aiModerator = require("../middleware/aiModerator"); // ⭐ NEW

/* ===========================
   HELPER → Convert YouTube URL
=========================== */
const convertToEmbedUrl = (url) => {
  if (!url) return url;

  if (url.includes("watch?v="))
    return url.replace("watch?v=", "embed/");

  if (url.includes("youtu.be/"))
    return url.replace("youtu.be/", "youtube.com/embed/");

  return url;
};

/* ===========================
   HELPER → Calculate Expiry
=========================== */
const calculateExpiry = (durationText) => {
  const expiry = new Date();

  if (!durationText) {
    expiry.setMonth(expiry.getMonth() + 1);
    return expiry;
  }

  const lower = durationText.toLowerCase();
  const number = parseInt(lower);

  if (lower.includes("day"))
    expiry.setDate(expiry.getDate() + number);
  else if (lower.includes("week"))
    expiry.setDate(expiry.getDate() + number * 7);
  else if (lower.includes("month"))
    expiry.setMonth(expiry.getMonth() + number);
  else
    expiry.setMonth(expiry.getMonth() + 1);

  return expiry;
};

/* =========================================================
   SPECIFIC ROUTES FIRST
========================================================= */

/* ===========================
   ML PRICE PREDICTOR (KNN)
=========================== */
router.post("/predict-price", auth, async (req, res) => {
  try {
    const { category, duration } = req.body;
    
    if (!category) {
      return res.status(400).send({ message: "Category is required for prediction." });
    }

    // Convert duration to approximate weeks for distance calculation
    const getWeeks = (dur) => {
      if (!dur) return 4; // default 4 weeks
      const lower = dur.toLowerCase();
      const num = parseInt(lower) || 4;
      if (lower.includes("day")) return num / 7;
      if (lower.includes("month")) return num * 4;
      return num; // assume weeks if not specified, or if explicitly weeks
    };

    const targetWeeks = getWeeks(duration);

    // Fetch all published courses in the same category
    const similarCourses = await Course.find({ category: { $regex: new RegExp(`^${category}$`, 'i') }, isPublished: true });

    if (similarCourses.length === 0) {
      return res.status(200).send({ suggestedPrice: 499, message: "No similar courses found. Default price suggested." });
    }

    // Calculate Euclidean distance based on duration and ratings
    const coursesWithDistance = similarCourses.map(course => {
      const courseWeeks = getWeeks(course.duration);
      // Distance formula: sqrt((targetWeeks - courseWeeks)^2)
      // We also slightly penalize courses with bad ratings to not recommend their prices as highly
      const ratingPenalty = course.averageRating ? (5 - course.averageRating) * 2 : 5; 
      
      const distance = Math.sqrt(Math.pow(targetWeeks - courseWeeks, 2)) + ratingPenalty;
      
      return {
        price: course.price || 0,
        distance
      };
    });

    // Sort by closest distance
    coursesWithDistance.sort((a, b) => a.distance - b.distance);

    // Take top K=5 neighbors
    const k = Math.min(5, coursesWithDistance.length);
    const topK = coursesWithDistance.slice(0, k);

    // Calculate average price of K nearest neighbors
    const sumPrice = topK.reduce((sum, c) => sum + c.price, 0);
    const avgPrice = sumPrice / k;

    // Apply a competitive variance (-5%) to suggest an optimal market-entry price
    const suggestedPrice = Math.max(99, Math.floor(avgPrice * 0.95)); // Minimum price 99

    res.status(200).send({ suggestedPrice });

  } catch (error) {
    console.error("ML Prediction Error:", error);
    res.status(500).send({ message: "Error predicting price" });
  }
});

/* ===========================
   GET TEACHER COURSES
=========================== */
router.get("/teacher", auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    const courses = await Course.find({ teacher: req.user._id });

    const updated = courses.map(course => ({
      ...course._doc,
      enrollmentCount: course.enrolledStudents?.length || 0,
      lectureCount: course.lectures?.length || 0
    }));

    res.send(updated);
  } catch (error) {
    console.error("Teacher Route Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   GET ALL PUBLISHED COURSES
=========================== */
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    let query = { isPublished: true };

    if (search) {
      query.$or = [
        { courseName: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let courses = await Course.find(query).populate("teacher", "-password").lean();

    const token = req.header("x-auth-token");
    let userPastCategories = new Set();
    let userPastTeachers = new Set();
    let userSearchHistory = [];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
        const user = await User.findById(decoded._id).populate("purchasedCourses.course");
        if (user) {
          if (user.purchasedCourses) {
            user.purchasedCourses.forEach(pc => {
              if (pc.course) {
                if (pc.course.category) userPastCategories.add(pc.course.category);
                if (pc.course.teacher) userPastTeachers.add(pc.course.teacher.toString());
              }
            });
          }
          userSearchHistory = user.searchHistory || [];

          if (search && search.trim().length >= 3) {
            userSearchHistory.unshift(search.trim());
            userSearchHistory = [...new Set(userSearchHistory)].slice(0, 10);
            user.searchHistory = userSearchHistory;
            await user.save();
          }
        }
      } catch (err) {
        console.error("Optional Auth error:", err.message);
      }
    }

    courses = courses.map(c => {
      let score = 0;
      
      // 1. History Match (+30 pts)
      if (userPastCategories.has(c.category)) score += 30;
      
      const validSearchTerms = userSearchHistory.filter(term => term && term.length >= 3);
      const searchHit = validSearchTerms.some(term => 
        (c.courseName && c.courseName.toLowerCase().includes(term.toLowerCase())) ||
        (c.category && c.category.toLowerCase().includes(term.toLowerCase()))
      );
      if (searchHit) score += 30;

      // 2. Creator/Teacher Affinity (+20 pts)
      if (c.teacher && c.teacher._id && userPastTeachers.has(c.teacher._id.toString())) {
        score += 20;
      }

      // 3. Quality & Trending (up to +10 pts)
      const ratingBonus = (c.averageRating || 0) * 1; 
      const enrollmentBonus = Math.min(5, ((c.totalEnrollments || 0) / 1000) * 5);
      score += ratingBonus + enrollmentBonus;

      // 4. Exploration/Dynamic (+0 to +10 pts)
      const randomJitter = Math.random() * 10;
      score += randomJitter;

      return { ...c, affinityScore: score };
    });

    courses.sort((a, b) => b.affinityScore - a.affinityScore);
    
    // Return top 100 to simulate a curated feed and improve performance
    const topCourses = courses.slice(0, 100);

    res.send(topCourses);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   GET SINGLE COURSE
=========================== */
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).send({ message: "Invalid Course ID" });

    const course = await Course.findById(req.params.id)
      .populate("teacher", "-password"); // ✅ FIXED

    if (!course)
      return res.status(404).send({ message: "Course not found" });

    res.send(course);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});
/* ===========================
   CREATE COURSE (CLOUDINARY)
=========================== */
router.post("/create", auth, upload.single("thumbnail"), aiModerator, async (req, res) => {
  try {
    if (req.user.role !== "teacher")
      return res.status(403).send({ message: "Only teachers can create courses" });

    const {
      courseName,
      category,
      duration,
      price,
      description,
      learningPoints
    } = req.body;

    const course = new Course({
      courseName,
      category,
      duration,
      price,
      description,
      learningPoints: learningPoints
        ? learningPoints.split(",").map(p => p.trim())
        : [],
      thumbnail: req.file ? req.file.path : "", // ✅ CLOUDINARY URL
      teacher: req.user._id,
      isPublished: false,
      publishDate: null
    });

    await course.save();
    res.status(201).send({ message: "Course created", course });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   UPDATE COURSE (CLOUDINARY)
=========================== */
router.put("/:id", auth, upload.single("thumbnail"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).send({ message: "Invalid Course ID" });

    const course = await Course.findById(req.params.id);

    if (!course)
      return res.status(404).send({ message: "Course not found" });

    if (course.teacher.toString() !== req.user._id)
      return res.status(403).send({ message: "Unauthorized" });

    const {
      courseName,
      category,
      duration,
      price,
      description,
      learningPoints
    } = req.body;

    if (courseName) course.courseName = courseName;
    if (category) course.category = category;
    if (duration) course.duration = duration;
    if (price !== undefined) course.price = price;
    if (description) course.description = description;

    if (learningPoints)
      course.learningPoints = learningPoints.split(",").map(p => p.trim());

    if (req.file)
      course.thumbnail = req.file.path; // ✅ CLOUDINARY

    await course.save();

    res.send({ message: "Course updated successfully", course });

  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   DELETE COURSE
=========================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).send({ message: "Invalid Course ID" });

    const course = await Course.findById(req.params.id);

    if (!course)
      return res.status(404).send({ message: "Course not found" });

    if (course.teacher.toString() !== req.user._id)
      return res.status(403).send({ message: "Unauthorized" });

    await course.deleteOne();

    res.send({ message: "Course deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   ADD LECTURE
=========================== */
router.post("/:id/add-lecture", auth, async (req, res) => {
  try {
    const { lectureTitle, lectureDescription, videoUrl } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course)
      return res.status(404).send({ message: "Course not found" });

    if (course.teacher.toString() !== req.user._id)
      return res.status(403).send({ message: "Unauthorized" });

    course.lectures.push({
      lectureTitle,
      lectureDescription,
      videoUrl: convertToEmbedUrl(videoUrl)
    });

    await course.save();

    res.send({ message: "Lecture added", course });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   EDIT LECTURE
=========================== */
router.put("/:courseId/lecture/:lectureId", auth, async (req, res) => {
  try {
    const { lectureTitle, lectureDescription, videoUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.courseId))
      return res.status(400).send({ message: "Invalid Course ID" });

    const course = await Course.findById(req.params.courseId);
    if (!course)
      return res.status(404).send({ message: "Course not found" });

    if (course.teacher.toString() !== req.user._id)
      return res.status(403).send({ message: "Unauthorized" });

    const lecture = course.lectures.id(req.params.lectureId);
    if (!lecture)
      return res.status(404).send({ message: "Lecture not found" });

    lecture.lectureTitle = lectureTitle || lecture.lectureTitle;
    lecture.lectureDescription = lectureDescription || lecture.lectureDescription;
    if (videoUrl) lecture.videoUrl = convertToEmbedUrl(videoUrl);

    await course.save();

    res.send({ message: "Lecture updated successfully", course });

  } catch (error) {
    console.error("Edit Lecture Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   DELETE LECTURE
=========================== */
router.delete("/:courseId/lecture/:lectureId", auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course)
      return res.status(404).send({ message: "Course not found" });

    if (course.teacher.toString() !== req.user._id)
      return res.status(403).send({ message: "Unauthorized" });

    course.lectures.pull(req.params.lectureId);

    await course.save();

    res.send({ message: "Lecture deleted successfully" });

  } catch (error) {
    console.error("Delete Lecture Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   ENROLL STUDENT
=========================== */
router.post("/:id/enroll", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user)
      return res.status(404).send({ message: "User not found" });

    const course = await Course.findById(req.params.id);

    if (!course || !course.isPublished)
      return res.status(400).send({ message: "Course not available" });

    if (!user.purchasedCourses)
      user.purchasedCourses = [];

    const alreadyEnrolled = user.purchasedCourses.some(
      c => c.course && c.course.toString() === course._id.toString()
    );

    if (alreadyEnrolled)
      return res.status(400).send({ message: "Already enrolled" });

    const coinsUsed = Math.min(user.coins || 0, course.price || 0);
    user.coins = Math.max(0, user.coins - coinsUsed);

    const expiryDate = calculateExpiry(course.duration);

    user.purchasedCourses.push({
      course: course._id,
      enrolledAt: new Date(),
      expiryDate,
      amountPaid: coinsUsed,
      paymentMethod: coinsUsed > 0 ? "coins" : "free",
      isActive: true
    });

    course.enrolledStudents.push(user._id);
    course.totalEnrollments = course.enrolledStudents.length;

    await user.save();
    await course.save();

    res.send({
      message: "Enrollment successful",
      expiryDate,
      remainingCoins: user.coins
    });

  } catch (error) {
    console.error("Enroll Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   ⭐ ADD REVIEW
=========================== */
router.post("/:id/review", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).send({ message: "User not found" });

    const course = await Course.findById(req.params.id);
    if (!course)
      return res.status(404).send({ message: "Course not found" });

    // 🚫 Prevent duplicate review
    const alreadyReviewed = course.reviews.find(
      (r) => r.user.toString() === req.user._id
    );

    if (alreadyReviewed)
      return res.status(400).send({ message: "You already reviewed this course" });

    // ✅ Analyze Sentiment
    let sentimentScore = 0;
    let sentimentCategory = "Neutral";
    
    if (comment) {
      const result = sentiment.analyze(comment);
      sentimentScore = result.score;
      if (sentimentScore > 0) sentimentCategory = "Positive";
      else if (sentimentScore < 0) sentimentCategory = "Negative";
    }

    // ✅ Add review
    course.reviews.push({
      user: req.user._id,
      userName: `${user.firstName} ${user.lastName}`,
      rating,
      comment,
      sentimentScore,
      sentimentCategory
    });

    // ⭐ Calculate average rating
    const totalRatings = course.reviews.reduce((sum, r) => sum + r.rating, 0);
    course.averageRating = totalRatings / course.reviews.length;

    await course.save();

    res.send({
      message: "Review added successfully",
      averageRating: course.averageRating,
      reviews: course.reviews
    });

  } catch (error) {
    console.error("Review Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   PUBLISH / UNPUBLISH
=========================== */
router.patch("/:id/publish", auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course)
      return res.status(404).send({ message: "Course not found" });

    if (course.teacher.toString() !== req.user._id)
      return res.status(403).send({ message: "Unauthorized" });

    course.isPublished = !course.isPublished;
    course.publishDate = course.isPublished ? new Date() : null;

    await course.save();

    res.send({
      message: "Publish status updated",
      isPublished: course.isPublished
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   📈 TEACHER ANALYTICS
=========================== */
router.get("/teacher/analytics", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== "teacher") {
      return res.status(403).send({ message: "Access denied. Teachers only." });
    }

    const courses = await Course.find({ teacher: user._id }).lean();
    
    let totalEnrollments = 0;
    let averageRatingSum = 0;
    let coursesWithRatings = 0;
    
    let sentimentCounts = {
      Positive: 0,
      Negative: 0,
      Neutral: 0
    };
    
    let courseEnrollments = [];

    courses.forEach(course => {
      totalEnrollments += (course.totalEnrollments || 0);
      courseEnrollments.push({
        name: course.courseName,
        enrollments: course.totalEnrollments || 0
      });
      
      if (course.averageRating > 0) {
        averageRatingSum += course.averageRating;
        coursesWithRatings++;
      }
      
      if (course.reviews && course.reviews.length > 0) {
        course.reviews.forEach(review => {
          if (review.sentimentCategory) {
            sentimentCounts[review.sentimentCategory]++;
          }
        });
      }
    });

    const averageRating = coursesWithRatings > 0 ? (averageRatingSum / coursesWithRatings).toFixed(1) : 0;

    res.send({
      totalCourses: courses.length,
      totalEnrollments,
      averageRating,
      sentimentCounts,
      courseEnrollments: courseEnrollments.sort((a,b) => b.enrollments - a.enrollments).slice(0, 5) // top 5 courses
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;