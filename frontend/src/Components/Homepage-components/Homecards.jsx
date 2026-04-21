import React from 'react'
import "./HomeCard.css"
import card_Data from '../../assets/Featuredata'
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Homecards() {
    const { t } = useTranslation();
    console.log(card_Data)
    return (
        <div className='features-container'>
            {
                card_Data.map((features, index) => (
                    <div className='features-card' id={features.id}>
                        <h1 className='feature-head'>{t(features.title)}</h1>
                        <div className='feature-description' style={{ flexDirection: `${features.flexDirection}` }}>
                            <div className='descriptions'>
                                <h1>{t(features.heading)}</h1>
                                <p>{t(features.description)}</p>
                                <Link to={features.link}><button className='feature-button'>{t(features.button)}</button></Link>
                            </div>
                            <div className='feature-image' style={{ backgroundImage: `url(${features.img})` }}></div>
                        </div>
                    </div>
                ))
            }
        </div>
    )
}

export default Homecards