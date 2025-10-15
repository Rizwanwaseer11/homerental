// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const Booking = require("../models/bookings");
const Property = require("../models/property");
const User = require("../models/users");
const { isAuthenticated } = require("../middlewares/auth");

// =========================
// SHOW ALL NOTIFICATIONS
// =========================
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const notifications = await Notification.find({ receiverId: req.session.userId })
      .populate({
        path: "bookingId",
        populate: { path: "propertyId", select: "title price location ownerId" }
      })
      .lean();

    res.render("notifications/view", {
      notifications,
      userRole: req.session.role || "renter", // ✅ always defined
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// =========================
// VIEW SINGLE NOTIFICATION DETAILS
// =========================
router.get("/view/:id", isAuthenticated, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate({
        path: "bookingId",
        populate: [
          { path: "propertyId", select: "title price location ownerId" },
          { path: "renterId", select: "name email phone" }
        ],
      })
      .lean();

    if (!notification) return res.status(404).send("Notification not found");

    const booking = notification.bookingId;
    const property = booking?.propertyId || null;

    let owner = null;
    let renter = null;

    if (property?.ownerId) {
      owner = await User.findById(property.ownerId).select("name email phone").lean();
    }

    if (booking?.renterId) {
      renter = await User.findById(booking.renterId).select("name email phone").lean();
    }

    // ✅ render with all required variables
    res.render("notifications/single", {
      notification,
      booking,
      property,
      owner,
      renter,
      userRole: req.session.role || "renter",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// =========================
// DELETE NOTIFICATION
// =========================
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.redirect("/notifications");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
