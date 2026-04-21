import React, { useState, useEffect } from "react";
import "./Cart.css";
import { useCart } from "./CartContext";
import { initiateRazorpayPayment } from "./PaymentService";
import axios from "axios";
import TranslatedText from "../TranslatedText";

const Cart = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [userCoins, setUserCoins] = useState(0); // ⭐ Coins fetch karne ke liye
  const [useCoins, setUseCoins] = useState(false); // ⭐ Checkbox state

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8080/api/users/me", {
          headers: { "x-auth-token": token }
        });
        setUserCoins(res.data.coins || 0);
      } catch (err) { console.error(err); }
    };
    fetchUser();
  }, []);

  const totalAmount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // ⭐ Discount Logic
  const discount = useCoins ? userCoins : 0;
  const finalPayable = Math.max(0, totalAmount - discount);

  const handleBuyNow = () => {
    if (cart.length === 0) return;
    setPaymentMsg("");
    setPaymentLoading(true);

    initiateRazorpayPayment({
      amount: finalPayable, // ⭐ Razorpay ko discounted amount jayega
      cartItems: cart,
      useCoins: useCoins,
      discountedPrice: finalPayable,
      onSuccess: async (paymentId) => {
        setPaymentLoading(false);
        setPaymentMsg(`✅ Payment Successful! ID: ${paymentId}`);
        await clearCart();
      },
      onFailure: (msg) => {
        setPaymentLoading(false);
        if (!msg.includes("cancelled")) setPaymentMsg(`❌ ${msg}`);
      },
    });
  };

  return (
    <div className="cart-container">
      <h2>Shopping Cart</h2>
      <div className="cart-items">
        {cart.map((item) => (
          <div key={item.productId} className="cart-item">
            <img src={item.image} alt={item.title} className="cart-item-img" />
            <div className="cart-item-info">
              <h3><TranslatedText text={item.title} /></h3>
              <div className="price-qty-row">
                <span className="item-price">₹{item.price}</span>
                <span className="item-qty">x {item.quantity}</span>
              </div>
            </div>
            <button className="remove-btn" onClick={() => removeFromCart(item.productId)}>
              {item.quantity > 1 ? "Reduce" : "Remove"}
            </button>
          </div>
        ))}
      </div>

      <div className="cart-total">
        {/* ⭐ COIN REDEMPTION BOX */}
        {userCoins > 0 && (
          <div className="coin-box" style={{ marginBottom: "15px", padding: "10px", background: "#f9f9f9", borderRadius: "8px" }}>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
              <input 
                type="checkbox" 
                checked={useCoins} 
                onChange={(e) => setUseCoins(e.target.checked)} 
              />
              <span>Use my <b>{userCoins}</b> coins (Save ₹{userCoins})</span>
            </label>
          </div>
        )}

        <h3 className="total-text">
          Total Amount: <span>₹{finalPayable}</span>
          {useCoins && <small style={{ display: "block", color: "#666", fontSize: "0.8rem" }}>(₹{userCoins} Discount applied)</small>}
        </h3>

        {paymentMsg && <p style={{ color: paymentMsg.startsWith("✅") ? "#27ae60" : "#e74c3c" }}>{paymentMsg}</p>}

        <div className="cart-actions">
          <button className="cart-buy-now-btn" onClick={handleBuyNow} disabled={paymentLoading || cart.length === 0}>
            {paymentLoading ? "Processing..." : `Buy Now (₹${finalPayable})`}
          </button>
          <button className="clear-cart-btn" onClick={clearCart}>Clear Cart</button>
        </div>
      </div>
    </div>
  );
};

export default Cart;