const mongoose = require("mongoose");
const bookingSchema = new mongoose.Schema({
  renterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "property", required: true },
  status: { type: String, enum: ["pending","confirmed","cancelled"], default: "pending" },
  payment: {
    amount: Number,
    method: String,
    status: { type: String, enum: ["paid","unpaid"], default: "unpaid" }
  },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Booking", bookingSchema);
