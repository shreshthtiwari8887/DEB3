import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import stateCulturalData from '../../assets/Culturalinfo';
import TranslatedText from '../TranslatedText';
import './StateDetail.css';

const StateDetail = () => {
  const { stateName } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [activeTab, setActiveTab] = useState('famous-food');
  const [stateData, setStateData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showHeaderForm, setShowHeaderForm] = useState(false);
  const [headerFiles, setHeaderFiles] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null,
    imagePreview: null
  });
  
  const [contentItems, setContentItems] = useState({
    'famous-food': [],
    'famous-places': [],
    'art-culture': []
  });
  const [loading, setLoading] = useState(true);

  // You can set the base URL depending on your environment
  const API_URL = 'http://localhost:8080/api/states';

  useEffect(() => {
    const fetchData = async () => {
      const decodedStateName = decodeURIComponent(stateName);
      const data = stateCulturalData[decodedStateName];
      
      if (data) {
        setStateData({
          name: decodedStateName,
          description: data.description,
          images: data.images || []
        });
      } else {
        enqueueSnackbar('State not found', { variant: 'error' });
        navigate('/');
        return;
      }

      try {
        // Fetch content items and header images concurrently
        const [contentRes, headerRes] = await Promise.all([
          axios.get(`${API_URL}/${encodeURIComponent(decodedStateName)}`),
          axios.get(`${API_URL}/${encodeURIComponent(decodedStateName)}/header`)
        ]);

        if (contentRes.data.success) {
          setContentItems(contentRes.data.data);
        }
        
        if (headerRes.data.success && headerRes.data.data.length > 0) {
          setStateData(prev => ({ ...prev, images: headerRes.data.data }));
        }

      } catch (error) {
        console.error('Error fetching state content or header:', error);
        enqueueSnackbar('Failed to load cultural info', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stateName, navigate, enqueueSnackbar]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: file, // Store the File object to send via FormData
          imagePreview: reader.result // Base64 for preview only
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      enqueueSnackbar('Please fill in all fields', { variant: 'warning' });
      return;
    }

    const payload = new FormData();
    payload.append('category', activeTab);
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    if (formData.image) {
      payload.append('image', formData.image);
    }

    try {
      const response = await axios.post(`${API_URL}/${encodeURIComponent(stateData.name)}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const newItem = response.data.data;
        
        setContentItems(prev => ({
          ...prev,
          [activeTab]: [newItem, ...prev[activeTab]] // prepend newest
        }));

        setFormData({
          title: '',
          description: '',
          image: null,
          imagePreview: null
        });
        setShowForm(false);
        enqueueSnackbar('Content added successfully!', { variant: 'success' });
      }
    } catch (err) {
      console.error('Error saving content:', err);
      enqueueSnackbar(err.response?.data?.error || 'Failed to add content', { variant: 'error' });
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      if (response.data.success) {
        setContentItems(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].filter(item => item.id !== id)
        }));
        enqueueSnackbar('Item deleted', { variant: 'info' });
      }
    } catch (err) {
      console.error('Error deleting content:', err);
      enqueueSnackbar('Failed to delete item', { variant: 'error' });
    }
  };

  const handleHeaderSubmit = async (e) => {
    e.preventDefault();
    if (headerFiles.length === 0) {
      enqueueSnackbar('Please select at least 1 image.', { variant: 'warning' });
      return;
    }
    if (headerFiles.length > 3) {
      enqueueSnackbar('You can upload a maximum of 3 images.', { variant: 'warning' });
      return;
    }

    const payload = new FormData();
    headerFiles.forEach(file => {
      payload.append('images', file);
    });

    try {
      const response = await axios.put(`${API_URL}/${encodeURIComponent(stateData.name)}/header`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setStateData(prev => ({ ...prev, images: response.data.data }));
        setShowHeaderForm(false);
        setHeaderFiles([]);
        enqueueSnackbar('Header images updated!', { variant: 'success' });
      }
    } catch (err) {
      console.error('Error saving header images:', err);
      enqueueSnackbar(err.response?.data?.error || 'Failed to update images', { variant: 'error' });
    }
  };

  if (loading || !stateData) {
    return (
      <div className="state-detail loading">
        <p>{t('Loading...')}</p>
      </div>
    );
  }

  const tabLabels = {
    'famous-food': t('Famous Food'),
    'famous-places': t('Famous Places'),
    'art-culture': t('Art, Culture & Tradition')
  };

  return (
    <div className="state-detail">
      <button className="back-btn" onClick={() => navigate('/')}>
        ← {t('Back to Home')}
      </button>

      <div className="state-header">
        <h1><TranslatedText text={stateData.name} /></h1>
        <p className="state-description"><TranslatedText text={stateData.description} /></p>
        
        <button 
          className="edit-header-btn" 
          onClick={() => setShowHeaderForm(!showHeaderForm)}
          style={{marginBottom: '10px'}}
        >
          {showHeaderForm ? 'Cancel Edit' : 'Edit Top Webpage Photos'}
        </button>

        {showHeaderForm && (
          <form className="header-edit-form" onSubmit={handleHeaderSubmit}>
            <div className="form-group">
              <label>Select up to 3 replacing images:</label>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={(e) => setHeaderFiles(Array.from(e.target.files))} 
              />
            </div>
            <button type="submit" className="submit-btn" style={{marginBottom: '20px'}}>
              Update Photos
            </button>
          </form>
        )}

        {stateData.images && stateData.images.length > 0 && (
          <div className="state-gallery">
            {stateData.images.map((img, index) => (
              <img key={index} src={img} alt={`${stateData.name} ${index + 1}`} />
            ))}
          </div>
        )}
      </div>

      <div className="tabs-container">
        <div className="tabs">
          {Object.keys(tabLabels).map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <div className="tab-content">
          <div className="content-header">
            <h2>{tabLabels[activeTab]}</h2>
            <button
              className="add-content-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '✕ Cancel' : '+ Add Content'}
            </button>
          </div>

          {showForm && (
            <form className="add-content-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter detailed description"
                  rows="5"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="image">Photo (Optional)</label>
                <div className="image-upload">
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {formData.imagePreview && (
                    <div className="image-preview">
                      <img src={formData.imagePreview} alt="Preview" />
                      <button
                         type="button"
                         onClick={() => setFormData({
                           ...formData,
                           image: null,
                           imagePreview: null
                         })}
                      >
                         Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="submit-btn">
                {t('Submit')}
              </button>
            </form>
          )}

          <div className="content-items">
            {contentItems[activeTab].length === 0 ? (
              <p className="no-content">{t('No content yet. Be the first to add!')}</p>
            ) : (
              contentItems[activeTab].map(item => (
                <div key={item.id} className="content-card">
                  <div className="card-content">
                    <h3><TranslatedText text={item.title} /></h3>
                    <p className="date">{item.createdAt}</p>
                    <p className="description"><TranslatedText text={item.description} /></p>
                  </div>

                  {item.image && (
                    <div className="card-image">
                      <img src={item.image} alt={item.title} />
                    </div>
                  )}

                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Delete this item"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StateDetail;
