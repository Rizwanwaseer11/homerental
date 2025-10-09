const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/users");
const router = express.Router();

// show signup form
router.get("/signup", (req, res) => {
  res.render("auth/signup");
});

// signup
router.post("/signup",
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).render("auth/signup", { errors: errors.array() });

    try {
      const { name, email, password, role } = req.body;
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) return res.status(400).render("auth/signup", { errors: [{ msg: "Email already used" }] });

      const user = new User({ name, email: email.toLowerCase().trim(), role });
      user.password = password; // virtual setter
      await user.save();

      req.session.userId = user._id;
      req.session.role = user.role;
      res.redirect("/properties");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
);

// show login form
router.get("/login", (req, res) => {
  res.render("auth/login");
});

// login
router.post("/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).render("auth/login", { error: "Invalid credentials" });

      const ok = await user.comparePassword(password);
      if (!ok) return res.status(401).render("auth/login", { error: "Invalid credentials" });

      req.session.userId = user._id;
      req.session.role = user.role;
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
);

// logout
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    res.redirect("/");
  });
});



module.exports = router;
module.exports = router;
module.exports = router;
