import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductCard from "./ProductCard";
import "./VendorProfile.css";

const ProductManager = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null); 

  // ⭐ Initial state with detailsUrl and stock
  const [formData, setFormData] = useState({ 
    title: "", price: "", category: "", stock: "", description: "", detailsUrl: "", images: [] 
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const handlePredictPrice = async () => {
    if (!formData.title || !formData.description) {
      alert("Please enter a Title and Description first so the AI can validate the product.");
      return;
    }

    if (!formData.images || formData.images.length === 0) {
      alert("Please upload at least 1 image of the product. The AI must visually validate it.");
      return;
    }
    
    setPredicting(true);
    try {
      // Create FormData to send image and text
      const aiData = new FormData();
      aiData.append("title", formData.title);
      aiData.append("description", formData.description);
      aiData.append("image", formData.images[0]); // Send first image for analysis

      const res = await axios.post("http://localhost:8080/api/products/predict-price-multimodal", 
        aiData,
        { headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" } }
      );
      
      if (res.data.match === false) {
        alert(`🚫 AI Validation Failed: ${res.data.reason}`);
      } else {
        alert(`✅ AI Validation Passed: ${res.data.reason}`);
        setFormData(prev => ({ ...prev, price: res.data.predictedPrice }));
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Error contacting AI Vision Predictor.");
    }
    setPredicting(false);
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/products/my-products", {
        headers: { "x-auth-token": token },
      });
      setProducts(res.data.products);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, images: files });
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const data = new FormData();
    for (const key in formData) {
      if (key === "images") {
        formData.images.forEach((img) => data.append("images", img));
      } else {
        data.append(key, formData[key]);
      }
    }
    try {
      const res = await axios.post("http://localhost:8080/api/products/add", data, {
        headers: { "x-auth-token": token, "Content-Type": "multipart/form-data" },
      });
      setProducts([res.data.product, ...products]);
      // Reset form correctly
      setFormData({ title: "", price: "", category: "", stock: 1, description: "", detailsUrl: "", images: [] });
      setImagePreviews([]);
      setShowAddForm(false);
    } catch (err) { alert("Failed to add product"); }
  };

  const confirmDelete = async () => {
    const id = showDeleteModal;
    try {
      await axios.delete(`http://localhost:8080/api/products/delete/${id}`, { 
        headers: { "x-auth-token": token } 
      });
      setProducts(products.filter((p) => p._id !== id));
      setShowDeleteModal(null);
    } catch (err) { 
      alert("Delete failed"); 
      setShowDeleteModal(null);
    }
  };

  if (loading) return <div className="status-msg">Loading...</div>;

  return (
    <div className="vendor-container">
      <div className="inventory-header">
        <h2 className="product-section-title">Your Inventory</h2>
        <button 
          className={`edit-btn-inline ${showAddForm ? "cancel-mode" : ""}`} 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "Add New Product"}
        </button>
      </div>

      {showAddForm && (
        <div className="form-animation-wrapper">
          <form className="edit-form" onSubmit={handleAddProduct}>
            <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            
            <div className="form-row" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input type="number" placeholder="Price" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required style={{ flex: 1 }} />
              
              <button 
                type="button" 
                onClick={handlePredictPrice}
                disabled={predicting}
                style={{ padding: "10px 15px", backgroundColor: "#8b5cf6", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap" }}
              >
                {predicting ? "👁️ Analyzing Image..." : "✨ AI Predict Price & Validate"}
              </button>

              {/* ⭐ Fix: Stock input with min="0" to prevent negatives */}
              <input 
                type="number" 
                placeholder="Stock Quantity" 
                min="0" 
                value={formData.stock === 0 ? "" : formData.stock} 
                onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                required 
              />
            </div>

            <input type="text" placeholder="Category (e.g. Jewelry, Home Decor)" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />

            {/* ⭐ New: Details URL input added */}
            <input 
              type="url" 
              placeholder="External Details URL (e.g. Wikipedia or Blog link)" 
              value={formData.detailsUrl} 
              onChange={(e) => setFormData({...formData, detailsUrl: e.target.value})} 
            />

            <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            
            <div className="file-input-group">
                <label>Upload Product Images:</label>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} />
            </div>

            <div className="form-preview-row">
                {imagePreviews.map((src, i) => <img key={i} src={src} alt="preview" className="form-preview-img" />)}
            </div>
            
            <button type="submit" className="publish-btn">Publish Product</button>
          </form>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to remove this product? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-modal-btn" onClick={() => setShowDeleteModal(null)}>Cancel</button>
              <button className="confirm-modal-btn" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="products-grid">
        {products.map((p) => (
          <ProductCard 
            key={p._id} 
            product={p} 
            onDelete={(id) => setShowDeleteModal(id)} 
          />
        ))}
      </div>
    </div>
  );
};

export default ProductManager;