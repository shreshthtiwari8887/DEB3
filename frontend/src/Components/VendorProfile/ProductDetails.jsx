 import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSnackbar } from "notistack";
import TranslatedText from "../TranslatedText";
import "./ProductDetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // State for Image Delete Confirmation Modal
  const [imageToDelete, setImageToDelete] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/products/${id}`);
      if (res.data.success) {
        setProduct(res.data.product);
        setEditData(res.data.product);
        setMainImage(res.data.product.images[0]);
      }
      setLoading(false);
    } catch (err) {
      enqueueSnackbar("Error loading product", { variant: "error" });
      setLoading(false);
    }
  };

  // Logic to perform the actual image deletion after confirmation
  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;
    
    if (product.images.length <= 1) {
      setImageToDelete(null);
      return enqueueSnackbar("Must have at least 1 image", { variant: "warning" });
    }

    const token = localStorage.getItem("token");
    try {
      const res = await axios.put(
        `http://localhost:8080/api/products/delete-image/${id}`,
        { imagePath: imageToDelete },
        { headers: { "x-auth-token": token } }
      );
      if (res.data.success) {
        setProduct(res.data.product);
        if (mainImage === imageToDelete) setMainImage(res.data.product.images[0]);
        enqueueSnackbar("Image removed successfully", { variant: "success" });
      }
      setImageToDelete(null);
    } catch (err) {
      enqueueSnackbar("Error deleting image", { variant: "error" });
      setImageToDelete(null);
    }
  };

  const handleImageUpload = async () => {
    if (product.images.length + selectedFiles.length > 5)
      return enqueueSnackbar("Max 5 images allowed", { variant: "error" });
    
    const token = localStorage.getItem("token");
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("images", file));
    
    try {
      const res = await axios.put(
        `http://localhost:8080/api/products/edit/${id}`,
        formData,
        {
          headers: {
            "x-auth-token": token,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res.data.success) {
        setProduct(res.data.product);
        setSelectedFiles([]);
        enqueueSnackbar("Photos added successfully!", { variant: "success" });
      }
    } catch (err) {
      enqueueSnackbar("Failed to upload", { variant: "error" });
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await axios.put(
        `http://localhost:8080/api/products/edit/${id}`,
        editData,
        { headers: { "x-auth-token": token } }
      );
      if (res.data.success) {
        setProduct(res.data.product);
        setIsEditing(false);
        enqueueSnackbar("Product details saved!", { variant: "success" });
      }
    } catch (err) {
      enqueueSnackbar("Failed to save changes", { variant: "error" });
    }
  };

  if (loading) return <div className="loader">Loading...</div>;
  if (!product) return <div className="error">Product not found</div>;

  return (
    <div className="pd-container">
      {/* Back Button with modern arrow */}
      <button className="pd-back-btn" onClick={() => navigate(-1)}>
        <span>‹</span> Back to Dashboard
      </button>

      {/* CUSTOM IMAGE DELETE CONFIRMATION MODAL */}
      {imageToDelete && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Remove Photo?</h3>
            <p>Are you sure you want to delete this image? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-modal-btn" onClick={() => setImageToDelete(null)}>
                Cancel
              </button>
              <button className="confirm-modal-btn" onClick={confirmDeleteImage}>
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pd-grid">
        <div className="pd-image-section">
          <div className="pd-main-img">
            {/* ⭐ Cloudinary Change: Removed localhost prefix */}
            <img src={mainImage} alt="Product" />
          </div>
          <div className="pd-thumbnails">
            {product.images.map((img, i) => (
              <div key={i} className="thumb-wrapper">
                <img
                  /* ⭐ Cloudinary Change: Removed localhost prefix */
                  src={img}
                  className={mainImage === img ? "active-thumb" : ""}
                  onClick={() => setMainImage(img)}
                  alt="thumbnail"
                />
                {/* Trigger Modal on click */}
                <button className="img-delete-btn" onClick={() => setImageToDelete(img)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pd-info-section">
          {!isEditing ? (
            <>
              <div className="pd-header">
                <h1><TranslatedText text={product.title} /></h1>
                <button className="pd-edit-btn" onClick={() => setIsEditing(true)}>
                  Edit Details
                </button>
              </div>
              <p className="pd-desc"><TranslatedText text={product.description} /></p>
              <h2 className="pd-price">₹{product.price}</h2>
              <p className="pd-stock">Stock: {product.stock}</p>

              {product.detailsUrl && (
                <div className="pd-link-preview">
                  <strong>Know More Link: </strong>
                  <a href={product.detailsUrl} target="_blank" rel="noopener noreferrer">
                    {product.detailsUrl}
                  </a>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSaveInfo} className="pd-edit-form">
              <h3>Edit Information</h3>
              <label>Product Title</label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                required
              />
              <label>Description</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                required
              />
              <div className="form-row">
                <div>
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={editData.price}
                    onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Stock</label>
                  <input
                    type="number"
                    value={editData.stock}
                    onChange={(e) => setEditData({ ...editData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>
              <label>Know More Link (detailsUrl)</label>
              <input
                type="text"
                placeholder="https://example.com"
                value={editData.detailsUrl}
                onChange={(e) => setEditData({ ...editData, detailsUrl: e.target.value })}
              />
              <div className="form-btns">
                <button type="submit" className="pd-save-btn">Save changes</button>
                <button
                  type="button"
                  className="pd-cancel-btn"
                  onClick={() => {
                    setIsEditing(false);
                    setEditData(product);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Modernized Add Photos Section */}
          <div className="pd-image-mgmt">
            <h4>📸 Manage Gallery ({product.images.length}/5)</h4>
            <div className="upload-box">
              <input
                type="file"
                multiple
                accept="image/*"
                className="pd-file-input"
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
              />
              <button 
                className="pd-upload-btn" 
                onClick={handleImageUpload} 
                disabled={selectedFiles.length === 0}
              >
                {selectedFiles.length > 0 
                  ? `🚀 Upload ${selectedFiles.length} New Photos` 
                  : "Add Photos"}
              </button>
            </div>
            <small>Supports JPG, PNG (Max 5 images total).</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;