import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Quick Links Section */}
        <div className="footer-links">
          <h4 className="footer-title">{t('Quick Links')}</h4>
          <ul>
            <li><Link to="/">{t('Home')}</Link></li>
            <li><Link to="/about">{t('About')}</Link></li>
            <li><Link to="/quizcard">{t('Quiz')}</Link></li>
            <li><Link to="/courses">{t('Courses')}</Link></li>
            <li><Link to="/marketplace">{t('Marketplace')}</Link></li>
            <li><Link to="/contact">{t('Contact')}</Link></li>
          </ul>
        </div>

        {/* Social Media Section */}
        <div className="footer-social-media">
          <h4 className="footer-title">{t('Follow Us')}</h4>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-linkedin-in"></i>
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>{t('© 2025 Darshan-E-Bharat. All Rights Reserved.')}</p>
      </div>
    </footer>
  );
};

export default Footer;

