import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateCourse.css";

const CreateCourse = () => {
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState({
    courseName: "",
    category: "",
    duration: "",
    price: "",
    description: "",
    learningPoints: ""
  });

  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);

  const handlePredictPrice = async () => {
    if (!courseData.category) {
      alert("Please enter a category first so the AI can analyze similar courses.");
      return;
    }
    
    setPredicting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/courses/predict-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token
        },
        body: JSON.stringify({
          category: courseData.category,
          duration: courseData.duration
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setCourseData(prev => ({ ...prev, price: data.suggestedPrice }));
      } else {
        alert(data.message || "Prediction failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Error contacting ML predictor.");
    }
    setPredicting(false);
  };

  const handleChange = (e) => {
    setCourseData({
      ...courseData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setThumbnail(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("courseName", courseData.courseName);
    formData.append("category", courseData.category);
    formData.append("duration", courseData.duration);
    formData.append("price", courseData.price);
    formData.append("description", courseData.description);
    formData.append("learningPoints", courseData.learningPoints);

    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    try {
      // STEP 1: CREATE COURSE
      const createRes = await fetch(
        "http://localhost:8080/api/courses/create",
        {
          method: "POST",
          headers: {
            "x-auth-token": token
          },
          body: formData
        }
      );

      const createdCourse = await createRes.json();

      if (!createRes.ok) {
        alert(createdCourse.message);
        setLoading(false);
        return;
      }

      // STEP 2: PUBLISH COURSE
      await fetch(
        `http://localhost:8080/api/courses/${createdCourse.course._id}/publish`,
        {
          method: "PATCH",
          headers: {
            "x-auth-token": token
          }
        }
      );

      alert("🎉 Course Created & Published Successfully!");
      navigate("/teacher-profile");

    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="create-course-container">
      <div className="create-course-header">
        <h1>Create New Classroom</h1>
        <button
          className="back-btn"
          onClick={() => navigate("/teacher-profile")}
        >
          ← Back
        </button>
      </div>

      <form className="create-course-form" onSubmit={handleSubmit}>

        <div className="form-section">
          <h2>Basic Information</h2>

          <input
            type="text"
            name="courseName"
            placeholder="Course Name"
            value={courseData.courseName}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="category"
            placeholder="Category / Domain"
            value={courseData.category}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="duration"
            placeholder="Duration (e.g. 6 Weeks)"
            value={courseData.duration}
            onChange={handleChange}
          />

          <div className="price-input-group" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="number"
              name="price"
              placeholder="Price (₹)"
              value={courseData.price}
              onChange={handleChange}
              required
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              className="ai-predict-btn" 
              onClick={handlePredictPrice}
              disabled={predicting}
              style={{ padding: "10px 15px", backgroundColor: "#8b5cf6", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap" }}
            >
              {predicting ? "✨ Analyzing Market..." : "✨ AI Predict Price"}
            </button>
          </div>
        </div>

        <div className="form-section">
          <h2>Course Thumbnail</h2>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

          {thumbnail && (
            <p className="file-preview">
              Selected: {thumbnail.name}
            </p>
          )}
        </div>

        <div className="form-section">
          <h2>Course Description</h2>

          <textarea
            name="description"
            placeholder="Write detailed course description..."
            value={courseData.description}
            onChange={handleChange}
            required
          />

          <textarea
            name="learningPoints"
            placeholder="What students will learn (comma separated)"
            value={courseData.learningPoints}
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="publish-btn" disabled={loading}>
            {loading ? "Publishing..." : "Create & Publish"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreateCourse;