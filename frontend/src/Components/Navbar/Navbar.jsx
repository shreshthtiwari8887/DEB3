import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { animateScroll as scroll } from "react-scroll";
import { useTranslation } from 'react-i18next';
import './Navbar.css';
import { useSnackbar } from 'notistack';
import { useCart } from '../Cart/CartContext';
import LanguageSwitcher from '../LanguageSwitcher';

const Navbar = () => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { fetchCart } = useCart();

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const firstName = localStorage.getItem('firstName');
  const lastName = localStorage.getItem('lastName');
  const username = firstName && lastName ? `${firstName} ${lastName}` : 'User';

  const profilePath =
    role === "teacher"
      ? "/teacher-profile"
      : role === "vendor"
      ? "/vendor-profile"
      : "/profile";

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login"; 
    enqueueSnackbar('Logged out!', { variant: 'info' });
    navigate('/');
  };

  const handleNavigation = (event) => {
    const targetClass = event.target.className;

    if (location.pathname === "/") {
      const targetElement = document.getElementById(targetClass);
      if (targetElement) {
        const navbarHeight = document.querySelector(".navbar").offsetHeight || 60;
        const extraOffset = 70;
        const yOffset =
          targetElement.getBoundingClientRect().top +
          window.scrollY -
          navbarHeight -
          extraOffset;

        scroll.scrollTo(yOffset, {
          duration: 800,
          smooth: "easeInOutQuad",
        });
      }
    } else {
      if (targetClass === 'quiz') navigate("/quizcard");
      if (targetClass === 'cource') navigate("/courses");
      if (targetClass === 'marketplace') navigate("/marketplace");
    }
  };

  const toggleSlidingPanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        <Link to="/" className="logo">
          <img src="/assets/Darshan_logo.png" alt="Logo" className="logo-img" />
          Darshan-E-Bharat
        </Link>

        <ul className={`nav-links ${isMobile ? 'mobile' : ''}`}>
          <li><Link to="/">{t('Home')}</Link></li>
          <li><Link to="/about">{t('About')}</Link></li>

          <li>
            <button id="features-button" className="quiz" onClick={handleNavigation}>
              {t('Quiz')}
            </button>
          </li>

          <li>
            <button id="features-button" className="cource" onClick={handleNavigation}>
              {t('Courses')}
            </button>
          </li>

          <li>
            <button id="features-button" className="marketplace" onClick={handleNavigation}>
              {t('Marketplace')}
            </button>
          </li>

          <li><Link to="/contact">{t('Contact')}</Link></li>
        </ul>

        <LanguageSwitcher />

        <div className="auth-buttons">
          {!token ? (
            <>
              <Link to="/signup">
                <button className="btn signup-btn">{t('Signup')}</button>
              </Link>
              <Link to="/login">
                <button className="btn login-btn">{t('Login')}</button>
              </Link>
            </>
          ) : (
            <div className="profile-section">
              <button className="profile-btn" onClick={toggleSlidingPanel}>
                {username} <span className="dropdown-arrow">&#9662;</span>
              </button>
            </div>
          )}
        </div>

        <div className="hamburger" onClick={() => setIsMobile(!isMobile)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>

      {token && (
        <>
          {isPanelOpen && <div className="panel-overlay" onClick={toggleSlidingPanel}></div>}

          <div className={`profile-panel ${isPanelOpen ? 'show' : ''}`}>
            <div className="panel-header">
              <button className="close-panel" onClick={toggleSlidingPanel}>
                &#10005;
              </button>
            </div>
            <div className="panel-content">
              <div className="user-avatar">
                {username.charAt(0).toUpperCase()}
              </div>
              <h2>{username}</h2>
              {/* Added dynamic class for admin badge color */}
              <p className={`user-role ${role === 'admin' ? 'admin-badge' : ''}`}>
                {role ? role.toUpperCase() : ''}
              </p>
              <hr />

              {/* ⭐ ADMIN DASHBOARD LINK (Only for Admin role) */}
              {role === "admin" && (
                <Link to="/admin-dashboard" className="panel-link admin-btn-link" onClick={toggleSlidingPanel}>
                  <i className="fas fa-user-shield"></i> {t('Admin Dashboard')}
                </Link>
              )}

              <Link to={profilePath} className="panel-link" onClick={toggleSlidingPanel}>
                <i className="fas fa-user-circle"></i> {t('My Profile')}
              </Link>

              <button onClick={handleLogout} className="panel-link logout-link">
                <i className="fas fa-sign-out-alt"></i> {t('Logout')}
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;