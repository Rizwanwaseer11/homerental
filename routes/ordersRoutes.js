const express = require("express");
const router = express.Router();
const Booking = require("../models/bookings");
const Property = require("../models/property");
const Notification = require("../models/notification");
const { isAuthenticated } = require("../middlewares/auth");
// Prevent user from booking the same house again if they already have a booking

// User removes (cancels) their order if still pending
router.post("/:id/remove", isAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).send("Booking not found");
    if (String(booking.renterId) !== String(req.session.userId)) return res.status(403).send("Not allowed");
    if (booking.status !== "pending") return res.status(403).send("Cannot remove accepted or rejected order");
    booking.status = "cancelled";
    await booking.save();
    // Optionally notify owner
    res.redirect("/orders/my");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
// Reject order (booking)
router.post("/:id/reject", isAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).send("Booking not found");
    const property = await Property.findById(booking.propertyId);
    if (!property) return res.status(404).send("Property not found");
    if (String(property.ownerId) !== String(req.session.userId)) return res.status(403).send("Not allowed");
    booking.status = "cancelled";
    await booking.save();
    // Notify renter
    await Notification.create({
      receiverId: booking.renterId,
      propertyId: property._id,
      message: `Your booking request for ${property.title} was rejected.`
    });
    res.redirect("/orders");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// Order details page for both owner and user
router.get("/details/:id", isAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({ path: "propertyId", model: "Property", populate: { path: "ownerId" } }) // 👈 added model: "Property"
      .populate("renterId");

    if (!booking) return res.status(404).send("Order not found");

    const isOwner =
      booking.propertyId &&
      booking.propertyId.ownerId &&
      String(booking.propertyId.ownerId._id) === String(req.session.userId);

    const isRenter = String(booking.renterId._id) === String(req.session.userId);

    if (!isOwner && !isRenter) return res.status(403).send("Not allowed");

    res.render("orders/details", { booking, isOwner, isRenter });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// User orders page: list bookings for current user (renter)
router.get("/my", isAuthenticated, async (req, res) => {
  try {
    const bookings = await Booking.find({ renterId: req.session.userId })
      .populate({ path: "propertyId", options: { lean: true } })
      .sort({ createdAt: -1 })
      .lean();
    res.render("orders/user", { bookings });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Owner orders page: list bookings for owner's properties
router.get("/", isAuthenticated, async (req, res) => {
  try {
    // Find all properties owned by this user
  const properties = await Property.find({ ownerId: req.session.userId }, "_id title").lean();
    const propertyIds = properties.map(p => p._id);
    // Find bookings for these properties
    const bookings = await Booking.find({ propertyId: { $in: propertyIds } })
      .populate({ path: "propertyId", options: { lean: true } })
      .populate({ path: "renterId", options: { lean: true } })
      .sort({ createdAt: -1 })
      .lean();
    res.render("orders/index", { bookings, properties });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});



router.post('/bookings/create/:propertyId', isAuthenticated, async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const existingBooking = await Booking.findOne({ renterId: req.session.userId, propertyId, status: { $in: ['pending', 'confirmed'] } });
    if (existingBooking) {
      return res.status(400).send('You already have a booking for this property.');
    }
    // ...existing booking creation logic...
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
