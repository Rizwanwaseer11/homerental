const express = require("express");
const Property = require("../models/property");
const User = require("../models/users");
const Booking = require("../models/bookings");
const { isAuthenticated, isAdmin } = require("../middlewares/auth");
const router = express.Router();

// Admin dashboard
router.get("/", isAuthenticated, isAdmin, async (req, res) => {
  const pendingProperties = await Property.find({ status: "pending" }).lean();
  const users = await User.find().lean();
  const bookings = await Booking.find().populate('propertyId').populate('renterId').lean();
  res.render("admin/dashboard", {
    pendingProperties,
    users,
    bookings,
    pageTitle: "Admin Dashboard"
  });
});

const Notification = require('../models/notification');
// Approve property
router.post("/properties/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
  const prop = await Property.findByIdAndUpdate(req.params.id, { status: "available" }, { new: true });
  if (prop) {
    await Notification.create({
      receiverId: prop.ownerId,
      propertyId: prop._id,
      message: `Your house (ID: ${prop._id}) is now listed on the site.`
    });
  }
  res.redirect("/admin");
});

// Reject property
router.post("/properties/:id/reject", isAuthenticated, isAdmin, async (req, res) => {
  await Property.findByIdAndUpdate(req.params.id, { status: "rejected" });
  res.redirect("/admin");
});

module.exports = router;
