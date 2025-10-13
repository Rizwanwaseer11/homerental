const mongoose = require("mongoose");

const notifSchema = new mongoose.Schema({
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "property" }, // ✅ keep lowercase
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },   // ✅ added
  message: String,
  status: { type: String, enum: ["unread", "read"], default: "unread" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Notification || mongoose.model("Notification", notifSchema);
