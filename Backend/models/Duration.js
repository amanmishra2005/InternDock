const mongoose = require("mongoose");

const durationSchema = new mongoose.Schema(
  {
    weeks: { type: Number, required: true },
    label: { type: String, required: true }, // e.g. "4 Weeks"
    fee: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Duration", durationSchema);
