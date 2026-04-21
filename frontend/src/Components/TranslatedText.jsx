import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// Global batch queue for optimizing API calls
let queue = [];
let timeoutId = null;

// Global local memory cache to keep it extremely rapid and responsive
const translationCache = {};
const API_URL = 'http://localhost:8080/api/translate';

const processQueue = async (targetLang) => {
  if (queue.length === 0) return;
  const currentBatch = [...queue];
  queue = [];
  
  const textsToTranslate = currentBatch.map(item => item.text);
  
  try {
    const res = await axios.post(`${API_URL}/batch`, { texts: textsToTranslate, to: targetLang });
    if (res.data.success) {
      res.data.translatedTexts.forEach((translatedText, index) => {
        const originalText = textsToTranslate[index];
        translationCache[`${originalText}-${targetLang}`] = translatedText;
        currentBatch[index].resolve(translatedText);
      });
    } else {
      // Fallback
      currentBatch.forEach(item => item.resolve(item.text));
    }
  } catch (err) {
    console.error('Translation batch error:', err);
    currentBatch.forEach(item => item.resolve(item.text));
  }
};

export const translateText = (text, targetLang) => {
  return new Promise((resolve) => {
    if (!text) return resolve(text);
    if (targetLang === 'en') return resolve(text);
    
    const cacheKey = `${text}-${targetLang}`;
    if (translationCache[cacheKey]) {
      return resolve(translationCache[cacheKey]);
    }
    
    queue.push({ text, resolve });
    
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      processQueue(targetLang);
    }, 100);
  });
};

export default function TranslatedText({ text }) {
  const { i18n } = useTranslation();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    let mounted = true;
    
    // Fallbacks
    if (!text || i18n.language === 'en') {
      setTranslated(text);
      return;
    }
    
    translateText(text, i18n.language).then((res) => {
      if (mounted) setTranslated(res);
    });

    return () => { mounted = false; };
  }, [text, i18n.language]);

  return <>{translated}</>;
}
