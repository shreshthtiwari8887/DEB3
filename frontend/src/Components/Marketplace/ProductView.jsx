import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useCart } from "../Cart/CartContext";
import { initiateRazorpayPayment } from "../Cart/PaymentService";
import { useSnackbar } from "notistack";
import TranslatedText from "../TranslatedText"; // ⭐ IMPORT
import "./ProductView.css";

const ProductView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { addToCart } = useCart();
    const isLoggedIn = localStorage.getItem("token");

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImg, setActiveImg] = useState(0);
    const [activeTab, setActiveTab] = useState("description");

    const [userCoins, setUserCoins] = useState(0);
    const [isBuyNowActive, setIsBuyNowActive] = useState(false);
    const [useCoins, setUseCoins] = useState(false);

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);

    // Summary states
    const [summary, setSummary] = useState(null);
    const [keywords, setKeywords] = useState([]);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryMessage, setSummaryMessage] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id || id === "undefined") return;
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:8080/api/products/${id}`); // ⭐ FIXED API ROUTE
                if (res.data.success) {
                    setProduct(res.data.product);
                }
            } catch (err) {
                console.error("Error fetching product", err);
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

        window.scrollTo(0, 0);
        fetchProduct();
        if (isLoggedIn) fetchUserCoins();
    }, [id, isLoggedIn]);

    // Summary fetch function
    const fetchSummary = async () => {
        if (!product) return;
        setSummaryLoading(true);
        setSummary(null);
        setKeywords([]);
        setSummaryMessage(null);
        try {
            const res = await axios.get(`http://localhost:8080/api/products/${product._id}/ai-overview`);
            setSummary(res.data.summary);
            setKeywords(res.data.keywords || []);
            setSummaryMessage(res.data.message);
        } catch (err) {
            console.error("Summary fetch failed", err);
            setSummaryMessage("Could not generate summary. Please try again.");
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!isLoggedIn) { navigate("/login"); return; }
        if (!product) return;
        addToCart({
            id: product._id,
            name: product.title,
            price: product.price,
            image: product.images?.[0] || "/assets/no-image.png"
        });
        enqueueSnackbar(`${product.title} added to cart!`, { variant: "success" });
    };

    const handleBuyNowClick = () => {
        if (!isLoggedIn) { navigate("/login"); return; }
        setIsBuyNowActive(true);
    };

    const handleFinalPayment = () => {
        const item = {
            id: product._id,
            name: product.title,
            price: product.price,
            image: product.images?.[0]
        };
        const finalPrice = useCoins ? Math.max(0, product.price - userCoins) : product.price;
        initiateRazorpayPayment({
            amount: finalPrice,
            cartItems: [item],
            useCoins,
            discountedPrice: finalPrice,
            onSuccess: (paymentId) => {
                enqueueSnackbar(`✅ Payment Successful! ID: ${paymentId}`, { variant: "success" });
                setIsBuyNowActive(false);
                window.location.reload();
            },
            onFailure: (msg) => {
                if (!msg.includes("cancelled")) {
                    enqueueSnackbar(`❌ ${msg}`, { variant: "error" });
                }
            },
        });
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!isLoggedIn) { navigate("/login"); return; }
        try {
            setSubmitting(true);
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `http://localhost:8080/api/products/${product._id}/review`,
                { rating, comment },
                { headers: { "x-auth-token": token } }
            );
            setProduct({
                ...product,
                reviews: res.data.reviews,
                averageRating: res.data.averageRating
            });
            setComment("");
            setShowReviewForm(false);
            // Summary reset karo jab naya review aaye
            setSummary(null);
            setKeywords([]);
            enqueueSnackbar("Review submitted!", { variant: "success" });
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || "Error submitting review", { variant: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const getStarLabel = (r) => {
        if (r === 1) return "Very Bad";
        if (r === 2) return "Bad";
        if (r === 3) return "Ok Ok";
        if (r === 4) return "Good";
        return "Very Good";
    };

    if (loading) return <div className="loader"><TranslatedText text="Loading Product..." /></div>;
    if (!product) return <div className="error"><TranslatedText text="Product not found." /></div>;

    const displayImages = product.images?.length > 0
        ? product.images.slice(0, 5)
        : ["/assets/no-image.png"];

    return (
        <div className="product-view-wrapper">
            <button className="back-arrow-btn" onClick={() => navigate(-1)}>
                <span className="arrow-icon">←</span> Back
            </button>

            <div className="product-main-container">
                <div className="image-gallery-section">
                    <div className="main-image-display">
                        <img src={displayImages[activeImg]} alt={product.title} />
                    </div>
                    <div className="thumbnail-strip">
                        {displayImages.map((img, index) => (
                            <div
                                key={index}
                                className={`thumb-box ${activeImg === index ? "active" : ""}`}
                                onClick={() => setActiveImg(index)}
                            >
                                <img src={img} alt="thumbnail" />
                            </div>
                        ))}
                    </div>

                    <div className="action-buttons">
                        {!isBuyNowActive ? (
                            <>
                                <button className="buynow-btn" onClick={handleBuyNowClick}>BUY NOW</button>
                                <button className="addtocart-btn" onClick={handleAddToCart}>ADD TO CART</button>
                            </>
                        ) : (
                            <div className="view-page-coin-section">
                                <p className="coin-status-text">Available Coins: 💰 {userCoins}</p>
                                <label className="coin-label-view">
                                    <input
                                        type="checkbox"
                                        checked={useCoins}
                                        onChange={(e) => setUseCoins(e.target.checked)}
                                    />
                                    <span>Use coins (Save ₹{userCoins})</span>
                                </label>
                                <div className="view-final-actions">
                                    <button className="confirm-pay-view" onClick={handleFinalPayment}>
                                        Pay ₹{useCoins ? Math.max(0, product.price - userCoins) : product.price}
                                    </button>
                                    <button className="cancel-pay-view" onClick={() => setIsBuyNowActive(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="product-details-section">
                    <nav className="breadcrumb"><TranslatedText text="Home" /> {">"} <TranslatedText text="Marketplace" /> {">"} <TranslatedText text={product.category} /></nav>
                    <h1 className="product-title"><TranslatedText text={product.title} /></h1>

                    <div className="rating-row">
                        <span className="rating-badge">{product.averageRating?.toFixed(1) || 0} ★</span>
                        <span className="review-count">({product.reviews?.length || 0} Reviews)</span>
                    </div>

                    <div className="price-row">
                        <span className="current-price">₹{product.price}</span>
                        <span className="stock-status">{product.stock > 0 ? "In Stock" : "Out of Stock"}</span>
                    </div>

                    <div className="policy-section">
                        <div className="policy-item">
                            <span className="policy-icon">🚚</span>
                            <div className="policy-text">
                                <strong>Free Delivery</strong>
                                <p>On orders above ₹500</p>
                            </div>
                        </div>
                        <div className="policy-item">
                            <span className="policy-icon">🔄</span>
                            <div className="policy-text">
                                <strong>7 Days Return</strong>
                                <p>Easy exchange & returns</p>
                            </div>
                        </div>
                    </div>

                    <div className="tribal-info-box">
                        <p><strong><TranslatedText text="Origin" />:</strong> <TranslatedText text={product.originState || "Tribal India"} /></p>
                        <p><strong><TranslatedText text="Tribe" />:</strong> <TranslatedText text={product.tribeName || "Traditional Community"} /></p>
                        <p><strong><TranslatedText text="Material" />:</strong> <TranslatedText text={product.materialUsed || "Authentic"} /></p>
                    </div>

                    <div className="tabs-container">
                        <div className="tab-header">
                            <button className={activeTab === "description" ? "active" : ""} onClick={() => setActiveTab("description")}><TranslatedText text="Description" /></button>
                            <button className={activeTab === "specifications" ? "active" : ""} onClick={() => setActiveTab("specifications")}><TranslatedText text="Specifications" /></button>
                            <button className={activeTab === "manufacturer" ? "active" : ""} onClick={() => setActiveTab("manufacturer")}><TranslatedText text="Artisan Info" /></button>
                            <button className={activeTab === "reviews" ? "active" : ""} onClick={() => setActiveTab("reviews")}><TranslatedText text="Reviews" /> ({product.reviews?.length || 0})</button>
                        </div>

                        <div className="tab-body">
                            {activeTab === "description" && (
                                <div className="tab-content-fade">
                                    <p className="desc-text"><TranslatedText text={product.description} /></p>
                                    {product.heritageHistory && (
                                        <div className="heritage-note">
                                            <h4>📜 <TranslatedText text="Cultural Significance:" /></h4>
                                            <p><TranslatedText text={product.heritageHistory} /></p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "specifications" && (
                                <div className="specs-table">
                                    <div className="spec-item">
                                        <span className="spec-label">Category</span>
                                        <span className="spec-value">{product.category}</span>
                                    </div>
                                    <div className="spec-item">
                                        <span className="spec-label">Primary Material</span>
                                        <span className="spec-value">{product.materialUsed}</span>
                                    </div>
                                    {product.authenticity && (
                                        <div className="spec-item"><span className="spec-label">Authenticity</span><span className="spec-value">{product.authenticity}</span></div>
                                    )}
                                    {product.artisanName && (
                                        <div className="spec-item"><span className="spec-label">Crafted By</span><span className="spec-value">{product.artisanName}</span></div>
                                    )}
                                    {product.dimensions && (
                                        <div className="spec-item"><span className="spec-label">Dimensions</span><span className="spec-value">{product.dimensions}</span></div>
                                    )}
                                    {product.weight && (
                                        <div className="spec-item"><span className="spec-label">Weight</span><span className="spec-value">{product.weight}</span></div>
                                    )}
                                    <div className="spec-item">
                                        <span className="spec-label">Care Instructions</span>
                                        <span className="spec-value">{product.careInstructions || "Handle with care"}</span>
                                    </div>
                                </div>
                            )}

                            {activeTab === "manufacturer" && (
                                <div className="manufacturer-details">
                                    <div className="artisan-card">
                                        <h3><TranslatedText text={product.vendorId?.shopName || "Authentic Tribal Artisan"} /></h3>
                                        <p className="location-text">📍 <TranslatedText text={product.vendorId?.city} />, <TranslatedText text={product.vendorId?.state} /></p>
                                        <div className="verification-badge">
                                            <TranslatedText text={product.vendorId?.isVerified ? "Verified Heritage Seller" : "Awaiting Verification"} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "reviews" && (
                                <div className="reviews-tab-content">

                                    {/* AI SUMMARY SECTION */}
                                    {product.reviews?.length > 0 ? (
                                        <div className="summary-section">
                                            {!summary && !summaryLoading && !summaryMessage && (
                                                <button
                                                    className="generate-summary-btn"
                                                    onClick={fetchSummary}
                                                >
                                                    ✨ Generate AI Summary
                                                </button>
                                            )}

                                            {summaryLoading && (
                                                <div className="summary-loading">
                                                    <div className="summary-spinner"></div>
                                                    <span>Analyzing reviews...</span>
                                                </div>
                                            )}

                                            {summary && !summaryLoading && (
                                                <div className="summary-box">
                                                    <div className="summary-header">
                                                        <h4>✨ AI Review Summary</h4>
                                                        <button className="regenerate-btn" onClick={fetchSummary}>↺ Refresh</button>
                                                    </div>
                                                    <p className="summary-text">{summary}</p>
                                                    {keywords.length > 0 && (
                                                        <div className="keywords-row">
                                                            {keywords.map((kw, i) => (
                                                                <span key={i} className="keyword-tag">{kw}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="no-summary-msg">
                                            <p>✨ AI summary will appear once reviews are added.</p>
                                        </div>
                                    )}

                                    {/* ADD REVIEW BUTTON */}
                                    <div className="review-top-bar">
                                        <span className="total-reviews-text">
                                            {product.reviews?.length || 0} Reviews
                                        </span>
                                        {!showReviewForm && (
                                            <button
                                                className="open-review-btn"
                                                onClick={() => {
                                                    if (!isLoggedIn) { navigate("/login"); return; }
                                                    setShowReviewForm(true);
                                                }}
                                            >
                                                + Add Review
                                            </button>
                                        )}
                                    </div>

                                    {/* REVIEW FORM */}
                                    {showReviewForm && (
                                        <div className="write-review-container">
                                            <div className="review-form-header">
                                                <h4>Rate this product</h4>
                                                <button
                                                    className="close-review-btn"
                                                    onClick={() => setShowReviewForm(false)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <form onSubmit={handleReviewSubmit}>
                                                <div className="star-selection">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <span
                                                            key={s}
                                                            className={`star-icon s-${s} ${rating >= s ? "active" : ""}`}
                                                            onClick={() => setRating(s)}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                    <span className={`rating-label label-${rating}`}>{getStarLabel(rating)}</span>
                                                </div>
                                                <textarea
                                                    placeholder="Write your review here..."
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    required
                                                />
                                                <button type="submit" disabled={submitting} className="submit-rev-btn">
                                                    {submitting ? "Posting..." : "Post Review"}
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {/* REVIEWS LIST */}
                                    <div className="reviews-list">
                                        {product.reviews?.length > 0 ? (
                                            product.reviews.map((rev, i) => (
                                                <div key={i} className="review-item">
                                                    <div className="rev-head">
                                                        <span className="rev-user">{rev.userName}</span>
                                                        <span className={`rev-stars color-${rev.rating}`}>
                                                            {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                                                        </span>
                                                    </div>
                                                    <p className="rev-text">{rev.comment}</p>
                                                    <span className="rev-date">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="no-rev-text">Be the first to review this heritage product!</p>
                                        )}
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductView;