const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  profilePic: { type: String },
  role: { type: String, enum: ["owner", "renter", "admin"], default: "renter" },
  createdAt: { type: Date, default: Date.now }
});

// virtual for password setter
userSchema.virtual("password")
  .set(function(password) {
    this._password = password;
    this.passwordHash = bcrypt.hashSync(password, 10);
  })
  .get(function(){ return this._password; });

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);
