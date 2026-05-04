import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// Global local memory cache to keep it extremely rapid and responsive
const translationCache = {};
const API_URL = 'http://localhost:8080/api/translate';

export const translateText = async (text, targetLang) => {
  if (!text) return text;
  if (targetLang === 'en') return text;
  
  const cacheKey = `${text}-${targetLang}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }
  
  try {
    const res = await axios.post(API_URL, { text, to: targetLang });
    if (res.data.success) {
      const result = res.data.translatedText;
      translationCache[cacheKey] = result;
      return result;
    }
  } catch (err) {
    console.error('Translation error:', err);
  }
  return text;
};

export default function TranslatedText({ text }) {
  const { i18n } = useTranslation();
  const [translated, setTranslated] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Normalize language code (e.g., 'hi-IN' -> 'hi')
    const currentLang = i18n.language ? i18n.language.split('-')[0] : 'en';

    // Fallbacks
    if (!text || currentLang === 'en') {
      setTranslated(text);
      setIsTranslating(false);
      return;
    }
    
    // Check cache first
    const cacheKey = `${text}-${currentLang}`;
    if (translationCache[cacheKey]) {
      setTranslated(translationCache[cacheKey]);
      setIsTranslating(false);
      return;
    }

    setIsTranslating(true);
    translateText(text, currentLang).then((res) => {
      if (mounted) {
        setTranslated(res || text); // Fallback to original if res is null
        setIsTranslating(false);
      }
    }).catch(err => {
       if (mounted) {
         setTranslated(text);
         setIsTranslating(false);
       }
    });

    return () => { mounted = false; };
  }, [text, i18n.language]);

  return <>{translated}</>;
}
