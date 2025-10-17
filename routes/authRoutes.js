const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/users");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/mailer");
 require("dotenv").config();

// ======================= SHOW SIGNUP FORM =======================
router.get("/signup", (req, res) => {
  res.render("auth/signup");
});

// ======================= SIGNUP =======================
router.post(
  "/signup",
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).render("auth/signup", { errors: errors.array() });

    try {
      const { name, email, password, role } = req.body;
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing)
        return res
          .status(400)
          .render("auth/signup", { errors: [{ msg: "Email already used" }] });

      const user = new User({
        name,
        email: email.toLowerCase().trim(),
        password,
        role,
      });
      await user.save();

      // ✅ Send welcome email
      await sendEmail(
        user.email,
        "Welcome to Home Rental!",
        `
        <h2>Welcome, ${user.name}!</h2>
        <p>We’re excited to have you on board at <b>Home Rental</b>.</p>
        <p>Start exploring or list your property today!</p>
        `
      );

      req.session.userId = user._id;
      req.session.role = user.role;
      res.redirect("/properties");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
);

// ======================= SHOW LOGIN FORM =======================
router.get("/login", (req, res) => {
  res.render("auth/login");
});

// ======================= LOGIN =======================
router.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user)
        return res.status(401).render("auth/login", { error: "Invalid credentials" });

      const ok = await user.comparePassword(password);
      if (!ok)
        return res.status(401).render("auth/login", { error: "Invalid credentials" });

      req.session.userId = user._id;
      req.session.role = user.role;
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
);

// ======================= LOGOUT =======================
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ======================= FORGOT PASSWORD FORM =======================
router.get("/forgetpassword", (req, res) => {
  res.render("auth/forgetpassword");
});

// ======================= HANDLE FORGOT PASSWORD =======================
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .render("auth/forgetpassword", { error: "No account found with that email." });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const resetLink = `${req.protocol}://${req.get(
      "host"
    )}/reset-password/${token}`;

    await sendEmail(
      user.email,
      "Reset Your Password - Home Rental",
      `
      <h3>Hello ${user.name},</h3>
      <p>You requested to reset your password.</p>
      <p>Click below to set a new password (valid for 15 minutes):</p>
      <a href="${resetLink}" style="background:#007bff;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;">Reset Password</a>
      `
    );

    res.render("auth/forgetpassword", {
      success: "Password reset link has been sent to your email.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ======================= RESET PASSWORD PAGE =======================
router.get("/reset-password/:token", async (req, res) => {
  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).send("Invalid or expired reset link");

  res.render("auth/resetpassword", { token: req.params.token });
});

// ======================= HANDLE RESET PASSWORD SUBMISSION =======================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).send("Invalid or expired token");

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetToken = null;
    user.resetTokenExpire = null;
    await user.save();

    await sendEmail(
      user.email,
      "Password Changed Successfully",
      `
      <h3>Hello ${user.name},</h3>
      <p>Your password has been successfully updated.</p>
      <p>If this wasn’t you, please contact support immediately.</p>
      `
    );

    res.render("auth/login", { success: "Password successfully updated! Please log in." });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
