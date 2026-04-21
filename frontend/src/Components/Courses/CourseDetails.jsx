import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./CourseDetails.css";
import TranslatedText from "../TranslatedText";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [course, setCourse] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [rating, setRating] = useState(0);
const [comment, setComment] = useState("");

  const getImageUrl = (thumbnail) => {
    if (!thumbnail) return "/default-image.jpg";
    if (thumbnail.startsWith("http")) return thumbnail;
    return `http://localhost:8080/${thumbnail.replace(/\\/g, "/")}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await fetch(
          `http://localhost:8080/api/courses/${id}`
        );
        const courseData = await courseRes.json();
        setCourse(courseData);

        if (token) {
          const userRes = await fetch(
            "http://localhost:8080/api/users/me",
            { headers: { "x-auth-token": token } }
          );
          const userData = await userRes.json();
          setUser(userData);

          const purchased = userData.purchasedCourses?.find(
            (c) => c.course === id || c.course?._id === id
          );

          if (purchased) setIsEnrolled(true);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [id, token]);
  const handleSubmitReview = async () => {
  if (!rating) {
    alert("Please select rating");
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:8080/api/courses/${id}/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token
        },
        body: JSON.stringify({ rating, comment })
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("Review added!");

      // refresh course data
      setCourse({
        ...course,
        reviews: data.reviews,
        averageRating: data.averageRating
      });

      setRating(0);
      setComment("");
    } else {
      alert(data.message);
    }

  } catch (err) {
    console.error(err);
  }
};

  if (!course) return <p>Loading...</p>;

  const demoLectures = course.lectures?.slice(0, 2) || [];
  const allLectures = course.lectures || [];

  return (
    <div className="cd2-wrapper">

      {/* HEADER */}
      <div className="cd2-header">
        <h1><TranslatedText text={course.courseName} /></h1>
        <p className="cd2-instructor">
          👨‍🏫 {course.teacher?.firstName} {course.teacher?.lastName}
        </p>

        <div className="cd2-meta">
          <span>
            📅{" "}
            {course.publishDate
              ? new Date(course.publishDate).toLocaleDateString("en-IN")
              : "Not Published"}
          </span>
          <span>🎥 {course.lectures?.length || 0} Lectures</span>
          <span>⏳ {course.duration}</span>
        </div>
      </div>

      <div className="cd2-main">

        {/* SIDEBAR */}
        <div className="cd2-sidebar">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            Course Overview
          </button>

          <button
            className={activeTab === "demo" ? "active" : ""}
            onClick={() => setActiveTab("demo")}
          >
            Demo Lectures
          </button>

          <button
            className={activeTab === "lectures" ? "active" : ""}
            onClick={() => setActiveTab("lectures")}
          >
            Full Lectures
          </button>
        </div>

        {/* CONTENT */}
        <div className="cd2-content">

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="cd2-overview-card">

              <div className="cd2-overview-top">

                <img
                  src={getImageUrl(course.thumbnail)}
                  alt="thumbnail"
                  className="cd2-thumbnail"
                  onError={(e) => { e.target.src = "/default-image.jpg"; }}
                />

                <div className="cd2-overview-text">
                  <h2>About This Course</h2>
                  <p><TranslatedText text={course.description} /></p>

                  {!isEnrolled && (
                    <button
                      className="cd2-enroll-btn"
                      onClick={() => navigate(`/enroll/${id}`)}
                    >
                      Enroll Now
                    </button>
                  )}

                  {isEnrolled && (
                    <div className="cd2-enrolled-badge">
                      ✅ You are enrolled
                    </div>
                  )}
                </div>
              </div>

              {/* 🔥 NEW: TUTOR DETAILS SECTION */}
              <div className="cd2-tutor-section">
                <h2>👨‍🏫 Meet Your Guru</h2>

                <div className="cd2-tutor-card">

                  <h3>
                    {course.teacher?.firstName} {course.teacher?.lastName}
                  </h3>

                  <p>
                    {course.teacher?.expertise} |{" "}
                    {course.teacher?.experience}
                  </p>

                  <p>{course.teacher?.bio || "No bio available"}</p>

                  <div className="cd2-tutor-grid">
                    <p><b>🌍 Region:</b> {course.teacher?.region || "Not added"}</p>
                    <p><b>🎭 Tradition:</b> {course.teacher?.tradition || "Not added"}</p>
                    <p><b>🎓 Teaching Style:</b> {course.teacher?.teachingStyle || "Not added"}</p>
                    <p><b>🗣️ Languages:</b> {course.teacher?.languages || "Not added"}</p>
                  </div>

                  {course.teacher?.demoVideo && (
                    <p className="cd2-demo-link">
                      🎥{" "}
                      <a
                        href={course.teacher.demoVideo}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Watch Demo
                      </a>
                    </p>
                  )}

                </div>
              </div>
              <div className="cd2-learning-section">
                <h3>What You'll Learn</h3>
                <ul>
                  {course.learningPoints?.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
                            {/* ⭐ REVIEW SECTION */}
<div className="cd2-review-section">

  <h3>⭐ Student Reviews</h3>

  {/* ⭐ ADD REVIEW */}
  {isEnrolled && (
    <div className="cd2-review-form">

      <div className="cd2-star-input">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            className={star <= rating ? "active-star" : ""}
          >
            ★
          </span>
        ))}
      </div>

      <textarea
        placeholder="Write your review..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button onClick={handleSubmitReview}>
        Submit Review
      </button>

    </div>
  )}

  {/* 🧾 REVIEW LIST */}
  <div className="cd2-review-list">

    {course.reviews?.length > 0 ? (
      course.reviews.map((review, index) => (
        <div key={index} className="cd2-review-card">

          <p className="review-user">
            {review.userName}
          </p>

          <p className="review-stars">
            {"★".repeat(review.rating)}
            {"☆".repeat(5 - review.rating)}
          </p>

          <p className="review-comment">
            <TranslatedText text={review.comment} />
          </p>

        </div>
      ))
    ) : (
      <p>No reviews yet</p>
    )}

  </div>

</div>


            </div>
          )}

          {/* DEMO */}
          {activeTab === "demo" && (
            <div className="cd2-video-section">
              {!token ? (
                <p>Please login to watch demo lectures.</p>
              ) : demoLectures.length === 0 ? (
                <p>No demo lectures available.</p>
              ) : (
                demoLectures.map((lecture) => (
                  <div key={lecture._id} className="cd2-video-card">
                    <h4>
                      {lecture.lectureTitle}
                      <span className="cd2-lecture-date">
                        {" "}•{" "}
                        {lecture.publishDate
                          ? `Published: ${new Date(lecture.publishDate).toLocaleDateString("en-IN")}`
                          : `Uploaded: ${new Date(lecture.createdAt).toLocaleDateString("en-IN")}`}
                      </span>
                    </h4>
                    <iframe
                      src={lecture.videoUrl}
                      title="demo"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </div>
                ))
              )}
            </div>
          )}

          {/* FULL LECTURES */}
          {activeTab === "lectures" && (
            <div className="cd2-video-section">
              {!isEnrolled ? (
                <p>Please enroll to access full lectures.</p>
              ) : (
                allLectures.map((lecture) => (
                  <div key={lecture._id} className="cd2-video-card">
                    <h4>
                      {lecture.lectureTitle}
                      <span className="cd2-lecture-date">
                        {" "}•{" "}
                        {lecture.publishDate
                          ? `Published: ${new Date(lecture.publishDate).toLocaleDateString("en-IN")}`
                          : `Uploaded: ${new Date(lecture.createdAt).toLocaleDateString("en-IN")}`}
                      </span>
                    </h4>
                    <iframe
                      src={lecture.videoUrl}
                      title="lecture"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CourseDetails;