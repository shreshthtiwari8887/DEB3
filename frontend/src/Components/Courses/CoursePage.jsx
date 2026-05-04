import React, { useEffect, useState } from "react";
import CourseCard from "./CourseCard";
import "./Courses.css";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

const CoursePage = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = {};
        if (token) headers["x-auth-token"] = token;

        /* ===========================
           FETCH ALL PUBLISHED COURSES
        =========================== */
        const courseRes = await fetch(
          `http://localhost:8080/api/courses?search=${encodeURIComponent(debouncedSearch)}`,
          { headers }
        );
        const courseData = await courseRes.json();

        setCourses(Array.isArray(courseData) ? courseData : []);

        /* ===========================
           FETCH USER PURCHASED COURSES
        =========================== */
        if (token) {
          const userRes = await fetch(
            "http://localhost:8080/api/users/me",
            {
              headers: { "x-auth-token": token }
            }
          );

          const userData = await userRes.json();

          // userData.purchasedCourses contains { course: { ... }, enrolledAt: ... }
          setPurchasedCourses(
            userData.purchasedCourses || []
          );
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, debouncedSearch]);

  return (
    <div className="student-course-page">
      <h1 className="student-course-title">
        {t("Explore Courses")}
      </h1>

      <div className="course-search-container">
        <div className="course-search-bar">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder={t("Search for courses, skills, or topics...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="loading-text">
          {t("Loading courses...")}
        </p>
      ) : (
        <>
          {/* ✅ ENROLLED COURSES SECTION */}
          {purchasedCourses.length > 0 && (
            <div className="enrolled-section">
              <h2 className="section-title">{t("My Enrolled Classrooms")}</h2>
              <div className="student-course-grid enrolled-grid">
                {purchasedCourses.map((item) => (
                  <CourseCard
                    key={item.course?._id}
                    course={item.course}
                    isEnrolled={true}
                  />
                ))}
              </div>
              <hr className="section-divider" />
            </div>
          )}

          {/* ALL COURSES SECTION */}
          <h2 className="section-title">{t("Recommended for You")}</h2>
          {courses.length === 0 ? (
            <p className="no-course-text">
              {t("No courses available yet.")}
            </p>
          ) : (
            <div className="student-course-grid">
              {courses.map((course) => {
                const isEnrolled = purchasedCourses.some(
                  (p) => p.course?._id === course._id
                );

                return (
                  <CourseCard
                    key={course._id}
                    course={course}
                    isEnrolled={isEnrolled}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CoursePage;