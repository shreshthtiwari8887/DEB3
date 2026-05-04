import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./CourseDetails.css";
import { useTranslation } from "react-i18next";
import TranslatedText from "../TranslatedText";
import { jsPDF } from "jspdf";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = localStorage.getItem("token");

  const [course, setCourse] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [rating, setRating] = useState(0);
const [comment, setComment] = useState("");

  const [quizData, setQuizData] = useState(null);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

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

const handleGenerateQuiz = async (lecture) => {
  setIsQuizLoading(true);
  setQuizData(null);
  setQuizResult(null);
  setUserAnswers({});
  try {
    const res = await fetch("http://localhost:8080/api/ai/generate-quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token
      },
      body: JSON.stringify({ notes: lecture.notes || lecture.lectureDescription })
    });
    
    const data = await res.json();
    if (res.ok) {
      setQuizData(data.quiz);
    } else {
      alert(data.message || "Failed to generate quiz.");
    }
  } catch (err) {
    console.error(err);
    alert("Error communicating with AI server.");
  } finally {
    setIsQuizLoading(false);
  }
};

const submitQuiz = () => {
  let score = 0;
  quizData.forEach((q, index) => {
    if (userAnswers[index] === q.answer) score++;
  });
  setQuizResult({ score, total: quizData.length });
};

const handleDownloadPDF = (lecture) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(99, 102, 241);
  doc.text(lecture.lectureTitle, 20, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Course: ${course.courseName}`, 20, 30);
  
  doc.setFontSize(14);
  doc.setTextColor(0);
  const splitText = doc.splitTextToSize(lecture.notes || "No notes available.", 170);
  doc.text(splitText, 20, 45);
  
  doc.save(`${lecture.lectureTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Notes.pdf`);
};

const generateAIOverview = () => {
  if (!course || !course.reviews || course.reviews.length === 0) return null;
  
  let pos = 0, neg = 0, neu = 0;
  course.reviews.forEach(r => {
    // Determine sentiment if it wasn't pre-calculated, just by rating to be safe
    if (r.sentimentCategory === "Positive" || r.rating >= 4) pos++;
    else if (r.sentimentCategory === "Negative" || r.rating <= 2) neg++;
    else neu++;
  });

  const total = course.reviews.length;
  const posPerc = (pos / total) * 100;
  const negPerc = (neg / total) * 100;

  let text = "Based on student reviews, ";
  if (posPerc > 80) text += "this course is highly acclaimed. Students consistently praise the instructor's clarity, the depth of the cultural content, and the well-structured lecture notes.";
  else if (posPerc > 50 && negPerc < 20) text += "the overall response is very positive. Most students enjoyed the content and found it valuable, though a few noted minor areas for improvement.";
  else if (negPerc > 50) text += "the reception is quite critical. Many students expressed dissatisfaction, frequently citing issues with audio quality, pacing, or video resolution.";
  else text += "opinions are mixed. While many appreciated the historical context and foundational teachings, some students experienced technical difficulties or felt the pacing could be improved.";

  return (
    <div style={{ padding: "20px", backgroundColor: "#f0fdf4", borderRadius: "10px", marginBottom: "20px", border: "1px solid #bbf7d0", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
      <h4 style={{ color: "#166534", display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", fontSize: "1.1rem" }}>
        <span>✨</span> AI Overview of Comments
      </h4>
      <p style={{ color: "#15803d", fontStyle: "italic", lineHeight: "1.6" }}>"{text}"</p>
    </div>
  );
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
          <span>🎥 {course.lectures?.length || 0} {t("Lectures")}</span>
          <span>⏳ <TranslatedText text={course.duration} /></span>
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
                      {t("Enroll Now")}
                    </button>
                  )}

                  {isEnrolled && (
                    <div className="cd2-enrolled-badge">
                      ✅ {t("Already Enrolled")}
                    </div>
                  )}
                </div>
              </div>

              {/* 🔥 NEW: TUTOR DETAILS SECTION */}
              <div className="cd2-tutor-section">
                <h2>👨‍🏫 <TranslatedText text="Meet Your Guru" /></h2>

                <div className="cd2-tutor-card">

                  <h3>
                    <TranslatedText text={course.teacher?.firstName} /> <TranslatedText text={course.teacher?.lastName} />
                  </h3>

                  <p>
                    <TranslatedText text={course.teacher?.expertise} /> |{" "}
                    <TranslatedText text={course.teacher?.experience} />
                  </p>

                  <p><TranslatedText text={course.teacher?.bio || "No bio available"} /></p>

                  <div className="cd2-tutor-grid">
                    <p><b>🌍 <TranslatedText text="Region" />:</b> <TranslatedText text={course.teacher?.region || "Not added"} /></p>
                    <p><b>🎭 <TranslatedText text="Tradition" />:</b> <TranslatedText text={course.teacher?.tradition || "Not added"} /></p>
                    <p><b>🎓 <TranslatedText text="Teaching Style" />:</b> <TranslatedText text={course.teacher?.teachingStyle || "Not added"} /></p>
                    <p><b>🗣️ <TranslatedText text="Languages" />:</b> <TranslatedText text={course.teacher?.languages || "Not added"} /></p>
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
                <h3><TranslatedText text="What You'll Learn" /></h3>
                <ul>
                  {course.learningPoints?.map((point, index) => (
                    <li key={index}><TranslatedText text={point} /></li>
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
        {t("Submit")}
      </button>

    </div>
  )}

  {/* ✨ AI OVERVIEW */}
  {generateAIOverview()}

  {/* 🧾 REVIEW LIST */}
  <div className="cd2-review-list">

    {course.reviews?.length > 0 ? (
      course.reviews.map((review, index) => (
        <div key={index} className="cd2-review-card">

          <p className="review-user">
            <TranslatedText text={review.userName} />
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
      <p><TranslatedText text="No reviews yet" /></p>
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
                      <TranslatedText text={lecture.lectureTitle} />
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
                    <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                      <h4>📝 <TranslatedText text="Lecture Notes" /></h4>
                      <p style={{ whiteSpace: "pre-wrap", marginBottom: "15px" }}><TranslatedText text={lecture.notes || "No notes available."} /></p>
                      
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button 
                          onClick={() => handleGenerateQuiz(lecture)}
                          style={{ padding: "8px 16px", backgroundColor: "#8b5cf6", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                          disabled={isQuizLoading}
                        >
                          {isQuizLoading ? "✨ Generating AI Quiz..." : "✨ Generate AI Practice Quiz"}
                        </button>

                        <button 
                          onClick={() => handleDownloadPDF(lecture)}
                          style={{ padding: "8px 16px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                        >
                          ⬇️ Download PDF
                        </button>
                      </div>
                    </div>
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
                      <TranslatedText text={lecture.lectureTitle} />
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
                    <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                      <h4>📝 <TranslatedText text="Lecture Notes" /></h4>
                      <p style={{ whiteSpace: "pre-wrap", marginBottom: "15px" }}><TranslatedText text={lecture.notes || "No notes available."} /></p>
                      
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button 
                          onClick={() => handleGenerateQuiz(lecture)}
                          style={{ padding: "8px 16px", backgroundColor: "#8b5cf6", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                          disabled={isQuizLoading}
                        >
                          {isQuizLoading ? "✨ Generating AI Quiz..." : "✨ Generate AI Practice Quiz"}
                        </button>

                        <button 
                          onClick={() => handleDownloadPDF(lecture)}
                          style={{ padding: "8px 16px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                        >
                          ⬇️ Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* AI QUIZ MODAL */}
      {quizData && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "90%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto" }}>
            <h2 style={{ color: "#8b5cf6", marginBottom: "20px" }}>✨ AI Generated Quiz</h2>
            
            {quizData.map((q, qIndex) => (
              <div key={qIndex} style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <p style={{ fontWeight: "bold", marginBottom: "10px" }}>{qIndex + 1}. <TranslatedText text={q.question} /></p>
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} style={{ marginBottom: "5px" }}>
                    <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
                      <input 
                        type="radio" 
                        name={`question-${qIndex}`} 
                        value={opt}
                        checked={userAnswers[qIndex] === opt}
                        onChange={() => setUserAnswers({...userAnswers, [qIndex]: opt})}
                        disabled={quizResult !== null}
                      />
                      <TranslatedText text={opt} />
                    </label>
                  </div>
                ))}
              </div>
            ))}

            {quizResult ? (
              <div style={{ marginTop: "20px", padding: "15px", backgroundColor: quizResult.score === quizResult.total ? "#dcfce3" : "#fee2e2", borderRadius: "8px", textAlign: "center" }}>
                <h3>You scored {quizResult.score} out of {quizResult.total}!</h3>
                {quizResult.score === quizResult.total ? <p>🎉 Excellent work!</p> : <p>📚 Keep studying and try again!</p>}
              </div>
            ) : (
              <button 
                onClick={submitQuiz}
                style={{ padding: "10px 20px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", width: "100%", marginTop: "10px" }}
              >
                Submit Answers
              </button>
            )}

            <button 
              onClick={() => { setQuizData(null); setQuizResult(null); }}
              style={{ padding: "10px 20px", backgroundColor: "#64748b", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", width: "100%", marginTop: "10px" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseDetails;