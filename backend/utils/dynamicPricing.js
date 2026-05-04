/**
 * Calculates dynamic pricing based on scarcity (stock) and demand (averageRating).
 * Returns an object with the modified price and a reason tag.
 */
const calculateDynamicPrice = (product) => {
  let dynamicPrice = product.price;
  let pricingReason = null;

  const stock = product.stock || 0;
  const rating = product.averageRating || 0;

  // 1. Scarcity Surge: Low stock, high demand
  if (stock > 0 && stock < 10 && rating >= 4.0) {
    dynamicPrice = Math.ceil(product.price * 1.05); // 5% Surge
    pricingReason = "🔥 High Demand Surge";
  } 
  // 2. Clearance Drop: High stock, average/low demand
  else if (stock > 30 && rating < 4.0) {
    dynamicPrice = Math.floor(product.price * 0.90); // 10% Discount
    pricingReason = "📉 Clearance Drop";
  }

  return {
    dynamicPrice,
    pricingReason
  };
};

module.exports = { calculateDynamicPrice };
