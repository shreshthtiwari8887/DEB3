import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { initiateCoursePayment } from "../Cart/PaymentService"; // ✅ IMPORT
import "./EnrollCourse.css";

const EnrollCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [course, setCourse] = useState(null);
  const [user, setUser] = useState(null);
  const [useCoins, setUseCoins] = useState(false);
  const [loading, setLoading] = useState(false);

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

        const userRes = await fetch(
          "http://localhost:8080/api/users/me",
          { headers: { "x-auth-token": token } }
        );
        const userData = await userRes.json();
        setUser(userData);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [id, token]);

  if (!course || !user) return <p>Loading...</p>;

  // ===========================
  // PRICE LOGIC
  // ===========================
  const originalPrice = course.price;
  const availableCoins = user.coins || 0;

  let coinsToUse = 0;

  if (useCoins) {
    coinsToUse = Math.min(availableCoins, originalPrice);
  }

  const payableAmount = originalPrice - coinsToUse;

  // ===========================
  // HANDLE ENROLL
  // ===========================
  const handleEnroll = async () => {
    setLoading(true);

    try {
      // ✅ CASE 1: FREE (coins cover full amount)
      if (payableAmount === 0) {
        const res = await fetch(
          "http://localhost:8080/api/payment/verify-course",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
            body: JSON.stringify({
              razorpay_order_id: "FREE",
              razorpay_payment_id: "FREE",
              razorpay_signature: "FREE",
              courseId: id,
              coinsUsed: useCoins ? coinsToUse : 0,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          alert(data.message);
          setLoading(false);
          return;
        }

        alert("🎉 Enrolled Successfully using Coins!");
        navigate(`/course/${id}`);
        return;
      }

      // ✅ CASE 2: PAYMENT REQUIRED
      initiateCoursePayment({
        amount: payableAmount,
        courseId: id,
        coinsUsed: useCoins ? coinsToUse : 0,

        onSuccess: (paymentId) => {
          alert(`🎉 Payment Successful!\nPayment ID: ${paymentId}`);
          navigate(`/course/${id}`);
        },

        onFailure: (msg) => {
          if (!msg.includes("cancelled")) {
            alert(`❌ ${msg}`);
          }
        },
      });

    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="enroll-page-container">
      <div className="enroll-main-card">

        <div className="enroll-image-section">
          <img
            src={getImageUrl(course.thumbnail)}
            alt="thumbnail"
            onError={(e) => { e.target.src = "/default-image.jpg"; }}
          />
        </div>

        <div className="enroll-content-section">

          <h1 className="enroll-course-title">
            {course.courseName}
          </h1>

          <p className="enroll-instructor">
            Instructor: {course.teacher?.firstName} {course.teacher?.lastName}
          </p>

          <p className="enroll-description">
            {course.description}
          </p>

          <div className="enroll-meta-info">
            <span>
              📅 Published:{" "}
              {course.publishDate
                ? new Date(course.publishDate).toLocaleDateString()
                : "Not Published"}
            </span>

            <span>
              ⏳ Duration: {course.duration}
            </span>
          </div>

          <div className="enroll-pricing-box">

            <div className="enroll-price-row">
              <span>Course Price:</span>
              <strong>₹ {originalPrice}</strong>
            </div>

            <div className="enroll-price-row">
              <span>Your Coins:</span>
              <strong>🪙 {availableCoins}</strong>
            </div>

            <div className="enroll-coin-toggle">
              <input
                type="checkbox"
                checked={useCoins}
                onChange={() => setUseCoins(!useCoins)}
              />
              <label>Use Coins</label>
            </div>

            <div className="enroll-price-row">
              <span>Coins Used:</span>
              <strong>🪙 {coinsToUse}</strong>
            </div>

            <div className="enroll-final-price">
              Remaining Payable: ₹ {payableAmount}
            </div>

          </div>

          <button
            className="enroll-payment-button"
            onClick={handleEnroll}
            disabled={loading}
          >
            {loading ? "Processing..." : "Enroll Now"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default EnrollCourse;