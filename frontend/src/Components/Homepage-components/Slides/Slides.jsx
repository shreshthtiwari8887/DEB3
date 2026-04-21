import React, { useState, useEffect } from 'react';
import './Slides.css';
import images from '../../../assets/slide_images';
import { useTranslation } from 'react-i18next';

function Slides() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);
  const handleClick = () =>{
    setCurrentIndex(prev => (prev + 1) % images.length);
  }

  return (
    <div className='slide-container'>
      <h1 className='slide-header'>{t("India's Heartbeat, Through Every Frame")}</h1>
      <div className="slider-wrapper">
        <div className="image-slider" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {images.map((image, idx) => (
            <div className="slide-item" key={idx}>
              <img src={image.src} alt={`Slide ${idx}`} className="slide-img" />
            </div>
          ))}
        </div>
        <div className='slider-circle'>
          {
            images.map((item, idx) =>(
              <span key={idx} className={currentIndex===idx?'circle':'inactive'} onClick={handleClick}></span>
            ))
          }
        </div> 
      </div>
    </div>
  );
}

export default Slides;
