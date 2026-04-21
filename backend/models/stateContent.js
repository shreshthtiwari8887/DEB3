const mongoose = require("mongoose");

const stateContentSchema = new mongoose.Schema(
  {
    stateName: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["famous-food", "famous-places", "art-culture"],
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String }, // Optional Cloudinary URL
  },
  { timestamps: true }
);

module.exports = mongoose.model("StateContent", stateContentSchema);
