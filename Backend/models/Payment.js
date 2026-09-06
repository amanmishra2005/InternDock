const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    orderId: { type: String, required: true },
    paymentId: String,
    utrNumber: String,
    payerName: String,
    registeredEmail: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["Pending", "Successful", "Failed", "Refunded", "Cancelled"], default: "Pending" },
    gatewayResponse: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

paymentSchema.index({ application: 1, createdAt: -1 });
paymentSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
