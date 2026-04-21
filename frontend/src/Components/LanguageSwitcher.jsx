import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="language-switcher">
      <button
        onClick={() => changeLanguage('en')}
        className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
      >
        English
      </button>
      <button
        onClick={() => changeLanguage('hi')}
        className={`lang-btn ${i18n.language === 'hi' ? 'active' : ''}`}
      >
        हिंदी
      </button>
    </div>
  );
};

export default LanguageSwitcher;
