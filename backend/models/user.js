const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

/* ===========================
   QUIZ SCHEMA
=========================== */
const quizSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  score: { type: Number, required: true },
  coins: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

/* ===========================
   PURCHASED COURSE SCHEMA
=========================== */
const purchasedCourseSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "coins", "free"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    paymentId: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

/* ===========================
   PURCHASED PRODUCT SCHEMA
=========================== */
const purchasedProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    title: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    paymentId: { type: String, required: true },
    purchasedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ===========================
   USER SCHEMA
=========================== */
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["user", "teacher", "vendor", "admin"],
      default: "user",
    },

    /* TEACHER */
    expertise: { type: String, default: "" },
    experience: { type: String, default: "" },
    bio: { type: String, default: "" },

    // ✅🔥 NEW FIELDS (VERY IMPORTANT)
    region: { type: String, default: "" },
    tradition: { type: String, default: "" },
    teachingStyle: { type: String, default: "" },
    languages: { type: String, default: "" },

    /* VENDOR + COMMON */
    shopName: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    description: String,

    documentUrl: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },

    /* WALLET */
    coins: { type: Number, default: 0 },

    /* QUIZ */
    quizResults: [quizSchema],

    /* LMS */
    purchasedCourses: [purchasedCourseSchema],
    purchasedProducts: [purchasedProductSchema],
    searchHistory: { type: [String], default: [] },
  },
  { timestamps: true }
);

/* ===========================
   TOKEN GENERATOR
=========================== */
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { _id: this._id, role: this.role },
    process.env.JWTPRIVATEKEY,
    { expiresIn: "7d" }
  );
};

/* ===========================
   VALIDATION
=========================== */
const validate = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().pattern(/^[A-Za-z\s]+$/).required().label("First Name").messages({
      "string.pattern.base": "First name should only contain letters.",
    }),
    lastName: Joi.string().pattern(/^[A-Za-z\s]+$/).required().label("Last Name").messages({
      "string.pattern.base": "Last name should only contain letters.",
    }),
    email: Joi.string().email().required(),
    password: passwordComplexity().required(),

    role: Joi.string().valid("user", "teacher", "vendor", "admin").optional(),

    expertise: Joi.string().allow(""),
    experience: Joi.string().allow(""),
    bio: Joi.string().allow(""),

    // ✅ NEW VALIDATION FIELDS
    region: Joi.string().allow(""),
    tradition: Joi.string().allow(""),
    teachingStyle: Joi.string().allow(""),
    languages: Joi.string().allow(""),
    demoVideo: Joi.string().allow(""),

    shopName: Joi.when("role", {
      is: "vendor",
      then: Joi.required(),
      otherwise: Joi.allow(""),
    }),

    phone: Joi.string().allow(""),
    documentUrl: Joi.string().allow("").label("Document URL"),

    address: Joi.string().allow(""),
    city: Joi.string().allow(""),
    state: Joi.string().allow(""),
    pincode: Joi.string().allow(""),
    description: Joi.string().allow(""),
  });

  return schema.validate(data);
};

const User = mongoose.model("user", userSchema);

module.exports = { User, validate };