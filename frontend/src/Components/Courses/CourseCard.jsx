// src/Components/Courses/CourseCard.jsx

import React from "react";
import { Link } from "react-router-dom";
import TranslatedText from "../TranslatedText";
import "./Courses.css";

const CourseCard = ({ course, isEnrolled }) => {

  /* ✅ IMAGE HANDLER */
  const getImageUrl = (thumbnail) => {
    if (!thumbnail) return "/default-image.jpg";
    if (thumbnail.startsWith("http")) return thumbnail;
    return `http://localhost:8080/${thumbnail.replace(/\\/g, "/")}`;
  };

  /* ⭐ RENDER STARS */
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;

    let stars = "";

    for (let i = 0; i < fullStars; i++) {
      stars += "★";
    }

    if (halfStar) {
      stars += "☆"; // simple half representation
    }

    while (stars.length < 5) {
      stars += "☆";
    }

    return stars;
  };

  return (
    <div className="student-course-card">

      {/* Thumbnail */}
      <div className="student-course-image">
        <img
          src={getImageUrl(course.thumbnail)}
          alt={course.courseName}
          onError={(e) => { e.target.src = "/default-image.jpg"; }}
        />

        {isEnrolled && (
          <span className="badge enrolled-badge">
            Enrolled
          </span>
        )}
      </div>

      {/* Content */}
      <div className="student-course-content">

        {/* Title */}
        <h3 className="course-title">
          <TranslatedText text={course.courseName} />
        </h3>

        {/* Instructor */}
        <p className="course-instructor">
          👨‍🏫 {course.teacher?.firstName} {course.teacher?.lastName}
        </p>

        {/* ⭐ NEW: RATING */}
        <div className="course-rating">
          {course.averageRating > 0 ? (
            <>
              <span className="stars">
                {renderStars(course.averageRating)}
              </span>
              <span className="rating-value">
                ({course.averageRating.toFixed(1)})
              </span>
            </>
          ) : (
            <span className="no-rating">No ratings yet</span>
          )}
        </div>

        {/* Description */}
        <p className="student-course-description">
          <TranslatedText text={course.description} />
        </p>

        {/* Meta Info */}
        <div className="course-meta-row">
          <span>🎥 {course.lectures?.length || 0} Lectures</span>

          {course.publishDate && (
            <span>
              📅 {new Date(course.publishDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="student-course-footer">

          <div className="price-section">
            <span className="student-course-price">
              ₹ {course.price}
            </span>
          </div>

          <Link
            to={`/course/${course._id}`}
            className="student-view-btn"
          >
            View Course
          </Link>

        </div>

      </div>

    </div>
  );
};

export default CourseCard;