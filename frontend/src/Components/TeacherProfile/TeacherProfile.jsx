import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Added Link for the home link
import TeacherAnalytics from "./TeacherAnalytics";
import "./TeacherProfile.css";

const TeacherProfile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [teacherDetails, setTeacherDetails] = useState({});
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true); // Added to track initial data load
  const [activeTab, setActiveTab] = useState("profile"); // Tab state

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    expertise: "",
    experience: "",
    phone: "",
    bio: "",

    // ✅ NEW FIELDS
    region: "",
    tradition: "",
    teachingStyle: "",
    languages: ""
  });
  const fetchData = async () => {
    try {
      const userRes = await fetch("http://localhost:8080/api/users/me", {
        headers: { "x-auth-token": token }
      });
      const userData = await userRes.json();

      setTeacherDetails(userData || {});
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        expertise: userData.expertise || "",
        experience: userData.experience || "",
        phone: userData.phone || "",
        bio: userData.bio || "",

        // ✅ NEW FIELDS
        region: userData.region || "",
        tradition: userData.tradition || "",
        teachingStyle: userData.teachingStyle || "",
        languages: userData.languages || ""
      });
      const courseRes = await fetch(
        "http://localhost:8080/api/courses/teacher",
        {
          headers: { "x-auth-token": token }
        }
      );
      const courseData = await courseRes.json();

      setCourses(
        Array.isArray(courseData)
          ? courseData
          : courseData?.courses || []
      );

    } catch (err) {
      console.error(err);
      setCourses([]);
    } finally {
      setLoading(false); // Data fetching is done
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      await fetch("http://localhost:8080/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token
        },
        body: JSON.stringify(formData)
      });

      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this course?"
    );
    if (!confirmDelete) return;

    try {
      await fetch(`http://localhost:8080/api/courses/${id}`, {
        method: "DELETE",
        headers: { "x-auth-token": token }
      });

      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handlePublish = async (id) => {
    try {
      await fetch(`http://localhost:8080/api/courses/${id}/publish`, {
        method: "PATCH",
        headers: { "x-auth-token": token }
      });

      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  /* ✅ FIX: IMAGE HANDLER */
  const getImageUrl = (thumbnail) => {
    if (!thumbnail) return "/default.png";

    // Cloudinary
    if (thumbnail.startsWith("http")) {
      return thumbnail;
    }

    // Local storage
    return `http://localhost:8080/${thumbnail}`;
  };

  // --- NEW STATUS LOGIC START ---
  if (loading) return <div className="status-msg">Loading teacher profile...</div>;

  if (teacherDetails.isRejected) {
    return (
      <div className="teacher-dashboard">
        <div className="rejected-card">
          <h1>❌ Application Rejected</h1>
          <p>We are sorry, but your teacher application has been rejected by the administrator.</p>
          <p className="reject-note">This usually happens due to unclear documents or incorrect details.</p>
          <div className="rejected-actions">
            <button
              className="reapply-btn"
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/signup");
              }}
            >
              Update Details & Re-apply
            </button>
            <Link to="/" className="home-link">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!teacherDetails.isVerified) {
    return (
      <div className="teacher-dashboard">
        <div className="verification-notice">
          <div className="notice-icon">⏳</div>
          <h3>Account Under Review</h3>
          <p>Your credentials and documents are currently being verified by our admin team.</p>
          <p>You will be able to manage your classrooms as soon as your account is approved.</p>
        </div>
      </div>
    );
  }
  // --- NEW STATUS LOGIC END ---

  return (
    <div className="teacher-dashboard">

      <div className="teacher-tabs">
        <button 
          className={activeTab === "profile" ? "active-tab" : ""} 
          onClick={() => setActiveTab("profile")}
        >
          👤 Profile & Courses
        </button>
        <button 
          className={activeTab === "analytics" ? "active-tab" : ""} 
          onClick={() => setActiveTab("analytics")}
        >
          📊 Analytics Dashboard
        </button>
      </div>

      {activeTab === "profile" ? (
        <>
          <div className="dashboard-header">

        {!isEditing ? (
          <>
<div>
        <h1>
          {teacherDetails?.firstName} {teacherDetails?.lastName}
        </h1>

        <p className="expertise">
          {teacherDetails?.expertise} | {teacherDetails?.experience}
        </p>

        <p>{teacherDetails?.email}</p>

        <p>📞 {teacherDetails?.phone || "Not added"}</p>

        <p className="teacher-bio">
          {teacherDetails?.bio || "No bio available"}
        </p>

        {/* ✅ NEW FIELDS DISPLAY */}
        <p><b>🌍 Region:</b> {teacherDetails?.region || "Not added"}</p>
        <p><b>🎭 Tradition:</b> {teacherDetails?.tradition || "Not added"}</p>
        <p><b>🎓 Teaching Style:</b> {teacherDetails?.teachingStyle || "Not added"}</p>
        <p><b>🗣️ Languages:</b> {teacherDetails?.languages || "Not added"}</p>
      </div>
            <div className="teacher-profile-actions">
              <button
                className="teacher-edit-btn"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit Profile
              </button>

              <button
                className="create-course-btn"
                onClick={() => navigate("/create-course")}
              >
                + Create Classroom
              </button>
            </div>
          </>
        ) : (
          <form className="teacher-edit-form" onSubmit={handleUpdate}>
            <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" />
            <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" />
            <input name="expertise" value={formData.expertise} onChange={handleChange} placeholder="Expertise" />
            <input name="experience" value={formData.experience} onChange={handleChange} placeholder="Experience" />
            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" />

            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="About Yourself"
              rows="3"
            />
            <input
              name="region"
              value={formData.region}
              onChange={handleChange}
              placeholder="Region (e.g., Rajasthan)"
            />

            <input
              name="tradition"
              value={formData.tradition}
              onChange={handleChange}
              placeholder="Tradition (Kathak, Bharatanatyam)"
            />

            <input
              name="teachingStyle"
              value={formData.teachingStyle}
              onChange={handleChange}
              placeholder="Teaching Style"
            />

            <input
              name="languages"
              value={formData.languages}
              onChange={handleChange}
              placeholder="Languages"
            />

            <div className="teacher-form-buttons">
              <button type="submit" className="teacher-save-btn">Save</button>
              <button type="button" className="teacher-cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        )}

      </div>

      <div className="stats-section">
        <div className="stat-card">
          <h3>Coins</h3>
          <p>💰 {teacherDetails?.coins || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total Courses</h3>
          <p>{Array.isArray(courses) ? courses.length : 0}</p>
        </div>

        <div className="stat-card">
          <h3>Total Enrollments</h3>
          <p>
            {Array.isArray(courses)
              ? courses.reduce(
                (sum, c) => sum + (c.enrollmentCount || 0),
                0
              )
              : 0}
          </p>
        </div>
      </div>

      <div className="teacher-course-grid">
        {!Array.isArray(courses) || courses.length === 0 ? (
          <p>No courses created yet.</p>
        ) : (
          courses.map((course) => (
            <div key={course._id} className="teacher-course-card">

              {/* ✅ FIXED IMAGE */}
              <img
                src={getImageUrl(course.thumbnail)}
                alt="thumbnail"
              />

              <h3>{course.courseName}</h3>
              <p>{course.description}</p>
<div className="teacher-course-rating">
  {course.averageRating > 0 ? (
    <>
      <span className="stars">
        {"★".repeat(Math.floor(course.averageRating))}
        {"☆".repeat(5 - Math.floor(course.averageRating))}
      </span>
      <span className="rating-value">
        ({course.averageRating.toFixed(1)})
      </span>
    </>
  ) : (
    <span className="no-rating">No ratings yet</span>
  )}
</div>
              <div className="course-meta">
                <span className="price">₹ {course.price}</span>
                <span>👥 {course.enrollmentCount || 0} Students</span>
                <span
                  className={`status ${course.isPublished ? "published" : "draft"
                    }`}
                >
                  {course.isPublished ? "Published" : "Draft"}
                </span>
              </div>

              {course.publishDate && (
                <p className="publish-date">
                  📅 Published on:{" "}
                  {new Date(course.publishDate).toLocaleDateString()}
                </p>
              )}

              <div className="teacher-course-actions">

                <div className="action-row">
                  <button
                    className="manage-btn"
                    onClick={() =>
                      navigate(`/manage-course/${course._id}`)
                    }
                  >
                    Manage
                  </button>

                  <button
                    className="edit-btn"
                    onClick={() =>
                      navigate(`/edit-course/${course._id}`)
                    }
                  >
                    Edit
                  </button>
                </div>

                <div className="action-row">
                  <button
                    className="publish-btn"
                    onClick={() => handlePublish(course._id)}
                  >
                    {course.isPublished ? "Unpublish" : "Publish"}
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(course._id)}
                  >
                    Delete
                  </button>
                </div>

              </div>

            </div>
          ))
        )}
      </div>

      <div className="quiz-section">
        <h2>Quiz Performance</h2>
        {teacherDetails?.quizResults?.length > 0 ? (
          teacherDetails.quizResults.map((quiz, idx) => (
            <div key={idx} className="quiz-card">
              <h4>{quiz.topic}</h4>
              <p>Score: {quiz.score}</p>
              <p>Coins: {quiz.coins}</p>
            </div>
          ))
        ) : (
          <p>No quiz attempts yet.</p>
        )}
      </div>
        </>
      ) : (
        <TeacherAnalytics token={token} />
      )}

    </div>
  );
};

export default TeacherProfile;