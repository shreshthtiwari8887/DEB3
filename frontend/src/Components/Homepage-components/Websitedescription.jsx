import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom
import { useTranslation } from "react-i18next";

const Websitedescription = () => {
  const { t } = useTranslation();

  const navigate = useNavigate(); // Initialize the navigate function
  const token = localStorage.getItem("token"); // Check for a token to determine if the user is logged in

  const handleExploreClick = () => {
    if (!token) {
      // If no token is found (user is not logged in), navigate to the signup page
      navigate("/signup");
    } else {
      // If the user is already logged in, you can choose to navigate elsewhere, or show a message
      // alert("You are already logged in!");
      navigate("/courses");
    }
  };

  return (
    <div className="home-container">
      <div className="content-box">
        <motion.h1 
          className="title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {t("Discover India's Cultural Tapestry")}
        </motion.h1>
        <motion.p 
          className="description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          {t("Journey through India's diverse heritage with an immersive digital experience. Explore traditional arts, historic landmarks, and cultural stories that define the soul of the nation.")}
        </motion.p>
        <motion.button 
          className="explore-button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          onClick={handleExploreClick} // Add the onClick event to navigate to signup page
        >
          {t("Explore Now")}
        </motion.button>
      </div>
    </div>
  );
};

export default Websitedescription;
