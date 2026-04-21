const mongoose = require("mongoose");

const stateHeaderSchema = new mongoose.Schema(
  {
    stateName: { type: String, required: true, unique: true },
    images: [{ type: String }], // Array of Cloudinary URLs
  },
  { timestamps: true }
);

module.exports = mongoose.model("StateHeader", stateHeaderSchema);
