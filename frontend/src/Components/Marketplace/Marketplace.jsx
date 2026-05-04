import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../Cart/CartContext";
import { initiateRazorpayPayment } from "../Cart/PaymentService";
import axios from "axios";
import { useTranslation } from "react-i18next";
import TranslatedText from "../TranslatedText"; // ⭐ IMPORT
import "./Marketplace.css";

const Marketplace = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isLoggedIn = localStorage.getItem("token");
  const { addToCart } = useCart();

  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoins, setUserCoins] = useState(0);
  const [activeBuyNowId, setActiveBuyNowId] = useState(null);
  const [useCoins, setUseCoins] = useState(false);

  useEffect(() => {
    fetchProducts();
    if (isLoggedIn) {
      fetchUserCoins();
    }
  }, [isLoggedIn]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/products/all");
      const formatted = res.data.products.map((p) => ({
        id: p._id,
        name: p.title,
        description: p.description,
        price: p.price,
        stock: Number(p.stock) || 0,
        image: p.images?.length ? p.images[0] : "/assets/no-image.png",
        createdAt: p.createdAt,
        originState: p.originState,
        tribeName: p.tribeName,
        materialUsed: p.materialUsed,
        authenticity: p.authenticity,
        artisanName: p.artisanName,
        // NEW: Mapping review data
        averageRating: p.averageRating || 0,
        reviewsCount: p.reviews?.length || 0
      }));
      formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDbProducts(formatted);
    } catch (err) {
      console.error("Failed to load marketplace products", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCoins = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8080/api/users/me", {
        headers: { "x-auth-token": token },
      });
      setUserCoins(res.data.coins || 0);
    } catch (err) {
      console.error("Failed to fetch coins", err);
    }
  };

  const handleAddToCart = (item) => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      addToCart(item);
    }
  };

  const handleBuyNowClick = (id) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    setActiveBuyNowId(id);
    setUseCoins(false);
  };

  const handleFinalPayment = (item) => {
    const finalPrice = useCoins ? Math.max(0, item.price - userCoins) : item.price;
    initiateRazorpayPayment({
      amount: finalPrice,
      cartItems: [item],
      useCoins: useCoins,
      discountedPrice: finalPrice,
      onSuccess: (paymentId) => {
        alert(`✅ Payment Successful!\nPayment ID: ${paymentId}`);
        setActiveBuyNowId(null);
        fetchUserCoins();
      },
      onFailure: (msg) => {
        if (!msg.includes("cancelled")) {
          alert(`❌ ${msg}`);
        }
      },
    });
  };

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <h2 className="marketplace-title">{t("Tribal Marketplace")}</h2>
        {isLoggedIn && (
          <div className="go-to-cart">
            <span style={{ marginRight: "15px", fontWeight: "bold", color: "#f39c12" }}>
              💰 {userCoins} Coins
            </span>
            <Link to="/cart">
              <button className="view-cart-btn">{t("Go to Cart")}</button>
            </Link>
          </div>
        )}
      </div>

      <div className="items-container">
        {loading ? (
          <p className="loading-msg">{t("Loading...")}</p>
        ) : dbProducts.length > 0 ? (
          dbProducts.map((item) => (
            <div key={item.id} className="item-card">

              {/* Image */}
              <div className="item-image-wrap">
                <img src={item.image} alt={item.name} className="item-image" />
              </div>

              {/* Info */}
              <div className="item-info">
                {/* Header Row: Tribe + Rating Badge */}
                <div className="card-top-row">
                    <p className="item-tribe">
                      <TranslatedText text={item.tribeName} /> · <TranslatedText text={item.originState} />
                    </p>
                    <div className="card-overall-rating">
                        <span className={`star-badge-market color-${Math.round(item.averageRating)}`}>
                            ★ {item.averageRating.toFixed(1)}
                        </span>
                        <span className="market-rev-count">({item.reviewsCount})</span>
                    </div>
                </div>

                <h3 className="item-name"><TranslatedText text={item.name} /></h3>
                <p className="item-description"><TranslatedText text={item.description} /></p>

                <div className="item-meta">
                  {item.materialUsed && (
                    <span className="meta-tag"><TranslatedText text={item.materialUsed} /></span>
                  )}
                </div>

                <div className="stock-badge">
                  {item.stock === 0 ? (
                    <span className="out">{t("Out of Stock")}</span>
                  ) : item.stock < 5 ? (
                    <span className="few">{t("Few Left")}</span>
                  ) : (
                    <span className="in">{t("In Stock")}</span>
                  )}
                </div>

                {item.stock > 0 && (
                  <div className="item-footer">
                    <p className="item-price">₹{item.price}</p>
                    <div className="action-area">
                      {activeBuyNowId !== item.id ? (
                        <div className="action-btns">
                          <button
                            className="add-to-cart-btn"
                            onClick={() => handleAddToCart(item)}
                          >
                            {t("+ Cart")}
                          </button>
                          <button
                            className="buy-now-btn"
                            onClick={() => handleBuyNowClick(item.id)}
                          >
                            {t("Buy Now")}
                          </button>
                        </div>
                      ) : (
                        <div className="coin-redemption-section">
                          <p className="coin-text">{t("Available Coins")}: {userCoins}</p>
                          <label className="coin-checkbox-label">
                            <input
                              type="checkbox"
                              checked={useCoins}
                              onChange={(e) => setUseCoins(e.target.checked)}
                            />
                            <span>{t("Use coins (Save")} ₹{userCoins})</span>
                          </label>
                          <div className="final-btns">
                            <button
                              className="confirm-pay-btn"
                              onClick={() => handleFinalPayment(item)}
                            >
                              {t("Pay")} ₹{useCoins ? Math.max(0, item.price - userCoins) : item.price}
                            </button>
                            <button
                              className="cancel-pay-btn"
                              onClick={() => setActiveBuyNowId(null)}
                            >
                              {t("Cancel")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="view-details">
                  <Link to={`/product-view/${item.id}`} className="view-link">
                    {t("View Details")} →
                  </Link>
                </div>
              </div>

            </div>
          ))
        ) : (
          <p className="empty-msg">{t("No products available in the database yet.")}</p>
        )}
      </div>
    </div>
  );
};

export default Marketplace;