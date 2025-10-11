const mongoose = require("mongoose");

const notifSchema = new mongoose.Schema({
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "property" }, // ✅ must match lowercase 'property'
  message: String,
  status: { type: String, enum: ["unread", "read"], default: "unread" },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Export model (ensure consistent lowercase name)
module.exports = mongoose.models.Notification || mongoose.model("Notification", notifSchema);
