const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");
const { isAuthenticated } = require("../middlewares/auth");

// Get all notifications for the logged-in user
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Mark all unread notifications as read
    await Notification.updateMany(
      { receiverId: userId, status: "unread" },
      { $set: { status: "read" } }
    );

    // Fetch all notifications for the user
    const notifications = await Notification.find({ receiverId: userId })
       .populate({ path: "propertyId", model: "property" })
  .populate({ path: "bookingId", model: "Booking" }) // ✅ add this line
  .sort({ createdAt: -1 })
  .lean();

    res.render("notifications/index", { notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).send("Server error");
  }
});

// Mark a specific notification as read
router.post("/:id/read", isAuthenticated, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { status: "read" });
    res.redirect("/notifications");
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
