const router = require("express").Router();
const { User, validate } = require("../models/user");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const Product = require("../models/product");

/* ===========================
   REGISTER USER
=========================== */
router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (user.isRejected) {
        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashPassword = await bcrypt.hash(req.body.password, salt);
        await User.findByIdAndUpdate(user._id, {
          ...req.body,
          password: hashPassword,
          isRejected: false,
          isVerified: false,
        });
        return res.status(201).send({ message: "Request re-submitted successfully!" });
      }
      return res.status(409).send({ message: "User with given email already exists!" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    await new User({ ...req.body, password: hashPassword }).save();
    res.status(201).send({ message: "User created successfully" });
  } catch (error) {
    console.error("REGISTER ERROR:", error.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/* ===========================
   GET USER PROFILE
=========================== */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "purchasedCourses.course",
        model: "Course",
      })
      .populate({
        path: "purchasedProducts.productId", // ✅ Added
        model: "Product",
      })
      .select("-password");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("ERROR IN /me ROUTE:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ===========================
   UPDATE PROFILE
=========================== */
router.put("/update", auth, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      expertise,
      experience,
      phone,
      bio,

      // ✅ NEW FIELDS
      region,
      tradition,
      teachingStyle,
      languages,
      demoVideo
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          firstName,
          lastName,
          expertise,
          experience,
          phone,
          bio,

          // ✅ ADD THESE (MAIN FIX)
          region,
          tradition,
          teachingStyle,
          languages,
          demoVideo
        },
      },
      { new: true }
    ).select("-password");

    if (!updatedUser)
      return res.status(404).send({ message: "User not found" });

    res.status(200).send({
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
});
/* ===========================
   GENERALIZED ADMIN ROUTES
=========================== */

// 1. Get Pending Users by Role (vendor or teacher)
router.get("/admin/pending/:role", async (req, res) => {
  try {
    const { role } = req.params;
    const pendingUsers = await User.find({
      role: role,
      isVerified: false,
      isRejected: false,
    });
    res.status(200).send({ users: pendingUsers });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// 1.5 Get Verified/Active Users by Role
router.get("/admin/verified/:role", async (req, res) => {
  try {
    const { role } = req.params;
    let query = { role: role };
    
    // For teachers and vendors, they must be verified. Normal users don't need verification.
    if (role === "teacher" || role === "vendor") {
      query.isVerified = true;
    }

    const verifiedUsers = await User.find(query);
    res.status(200).send({ users: verifiedUsers });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// 2. Get Admin Stats (Registered counts)
router.get("/admin/stats", async (req, res) => {
  try {
    const verifiedTeachersCount = await User.countDocuments({ role: "teacher", isVerified: true });
    const verifiedVendorsCount = await User.countDocuments({ role: "vendor", isVerified: true });
    
    res.status(200).send({ 
      teachers: verifiedTeachersCount, 
      vendors: verifiedVendorsCount 
    });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// 3. Universal Verify Route
router.put("/admin/verify-user/:id", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isVerified: true });
    res.status(200).send({ message: "User approved successfully!" });
  } catch (error) {
    res.status(500).send({ message: "Error approving user" });
  }
});

// 3. Universal Reject Route
router.put("/admin/reject-user/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isRejected: true, isVerified: false },
      { new: true }
    );
    if (!user) return res.status(404).send({ message: "User not found" });
    res.status(200).send({ message: "User rejected successfully" });
  } catch (error) {
    res.status(500).send({ message: "Server Error" });
  }
});

module.exports = router;