import React, { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, ResponsiveContainer
} from "recharts";
import "./TeacherProfile.css";

const TeacherAnalytics = ({ token }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/courses/teacher/analytics", {
          headers: { "x-auth-token": token }
        });
        const data = await res.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token]);

  if (loading) return <p>Loading Analytics...</p>;
  if (!analytics) return <p>Failed to load analytics.</p>;

  const pieData = [
    { name: "Positive", value: analytics.sentimentCounts.Positive || 0, color: "#4ade80" },
    { name: "Neutral", value: analytics.sentimentCounts.Neutral || 0, color: "#94a3b8" },
    { name: "Negative", value: analytics.sentimentCounts.Negative || 0, color: "#f87171" }
  ].filter(d => d.value > 0);

  return (
    <div className="teacher-analytics-container">
      <h2>📈 Teacher Dashboard Analytics</h2>
      
      <div className="analytics-summary-cards">
        <div className="stat-card">
          <h3>Total Courses</h3>
          <p className="stat-value">{analytics.totalCourses}</p>
        </div>
        <div className="stat-card">
          <h3>Total Enrollments</h3>
          <p className="stat-value">{analytics.totalEnrollments}</p>
        </div>
        <div className="stat-card">
          <h3>Average Rating</h3>
          <p className="stat-value">⭐ {analytics.averageRating}</p>
        </div>
      </div>

      <div className="charts-container">
        {/* Sentiment Analysis Pie Chart */}
        <div className="chart-box">
          <h3>Review Sentiment Analysis</h3>
          <p className="chart-subtitle">NLP-based analysis of all student reviews</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <PieTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No reviews available yet.</p>
          )}
        </div>

        {/* Top Courses Bar Chart */}
        <div className="chart-box">
          <h3>Top Courses by Enrollment</h3>
          <p className="chart-subtitle">Your most popular content</p>
          {analytics.courseEnrollments.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analytics.courseEnrollments}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tickFormatter={(name) => name.substring(0, 15) + "..."} />
                <YAxis />
                <BarTooltip />
                <Bar dataKey="enrollments" fill="#6366f1" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No courses available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;
