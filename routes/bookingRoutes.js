const express = require("express");
const Booking = require("../models/bookings");
const Property = require("../models/property");
const Notification = require("../models/notification");
const { isAuthenticated, isRenter } = require("../middlewares/auth");

const router = express.Router();

// ---------------------------------------------------------------------------
// GET: Booking details page
// ---------------------------------------------------------------------------
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).send("Booking not found");

    const property = await Property.findById(booking.propertyId);
    if (!property) return res.status(404).send("Property not found");

    // Only owner or renter can view
    if (
      String(booking.renterId) !== String(req.session.userId) &&
      String(property.ownerId) !== String(req.session.userId)
    ) {
      return res.status(403).send("Not allowed");
    }

    // Always send these variables so EJS never breaks
    res.render("bookings/details", {
      booking,
      property,
      alreadyBooked: false, // default
      currentUserRole: req.session.role, // assumed stored in session
      currentUserId: req.session.userId
    });
  } catch (err) {
    console.error("Error loading booking details:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------------------------------------------------------------
// POST: Create new booking
// ---------------------------------------------------------------------------
router.post("/create/:propertyId", isAuthenticated, isRenter, async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const prop = await Property.findById(propertyId);
    if (!prop || prop.status !== "available") {
      return res.status(400).send("Property not available");
    }

    // Check if renter already has a booking for this property
    const existingBooking = await Booking.findOne({
      renterId: req.session.userId,
      propertyId,
      status: { $in: ["pending", "confirmed"] }
    });

    if (existingBooking) {
      // Return booking details with "alreadyBooked" message
      return res.status(400).render("bookings/details", {
        booking: existingBooking,
        property: prop,
        alreadyBooked: true,
        currentUserRole: "renter",
        currentUserId: req.session.userId
      });
    }

    // Create new booking
    const booking = new Booking({
      renterId: req.session.userId,
      propertyId,
      status: "pending",
      payment: {
        amount: prop.price,
        method: req.body.method || "offline",
        status: "unpaid"
      }
    });

    await booking.save();

    // Notify property owner
    await Notification.create({
      receiverId: prop.ownerId,
      propertyId: prop._id,
      message: `New booking request for your property: ${prop.title}`
    });

    res.redirect("/bookings/" + booking._id);
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------------------------------------------------------------
// POST: Owner approves booking
// ---------------------------------------------------------------------------
router.post("/:id/approve", isAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).send("Booking not found");

    const property = await Property.findById(booking.propertyId);
    if (!property) return res.status(404).send("Property not found");

    // Only property owner can approve
    if (String(property.ownerId) !== String(req.session.userId)) {
      return res.status(403).send("Not allowed");
    }

    booking.status = "confirmed";
    await booking.save();

    property.status = "rented";
    await property.save();

    // Notify renter about approval
    await Notification.create({
      receiverId: booking.renterId,
      propertyId: property._id,
      message: `Your booking for ${property.title} has been approved!`
    });

    res.redirect("/bookings/" + booking._id);
  } catch (err) {
    console.error("Error approving booking:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
