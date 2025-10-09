const mongoose = require("mongoose");
const notifSchema = new mongoose.Schema({
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "property" },
  message: String,
  status: { type: String, enum: ["unread","read"], default: "unread" },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Notification", notifSchema);
