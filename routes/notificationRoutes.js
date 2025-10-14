// routes/notifications.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");
const Booking = require("../models/bookings");
const Property = require("../models/property");
const { isAuthenticated } = require("../middlewares/auth");

// ✅ Get all notifications for logged-in user
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Mark unread notifications as read
    await Notification.updateMany(
      { receiverId: userId, status: "unread" },
      { $set: { status: "read" } }
    );

    // Fetch all notifications
    const rawNotifications = await Notification.find({ receiverId: userId })
      .populate({ path: "propertyId", model: "Property" })
      .populate({
        path: "bookingId",
        model: "Booking",
        populate: [
          { path: "renterId", model: "User" },
          { path: "ownerId", model: "User" },
          { path: "propertyId", model: "Property" }
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Build booking detail URL depending on user role
    const notifications = rawNotifications.map((n) => ({
      ...n,
      bookingUrl: n.bookingId
        ? `/notifications/view/${n._id}`
        : null,
    }));

    res.render("notifications/index", { notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).send("Server error");
  }
});


// ✅ View single notification details (home + renter/owner info)
router.get("/view/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const notification = await Notification.findById(req.params.id)
      .populate({
        path: "bookingId",
        model: "Booking",
        populate: [
          { path: "renterId", model: "User" },
          { path: "ownerId", model: "User" },
          { path: "propertyId", model: "Property" }
        ],
      })
      .lean();

    if (!notification) {
      return res.status(404).send("Notification not found");
    }

    const booking = notification.bookingId;
    if (!booking) {
      return res.status(404).send("Booking not found");
    }

    // ✅ Render a page with details (we’ll make EJS below)
    res.render("notifications/view", {
      notification,
      booking,
      userRole: req.session.role,
      currentUserId: userId,
    });
  } catch (err) {
    console.error("Error fetching notification details:", err);
    res.status(500).send("Server error");
  }
});


// ✅ Delete notification
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.redirect("/notifications");
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
