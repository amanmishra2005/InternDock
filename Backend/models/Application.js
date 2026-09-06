const mongoose = require("mongoose");

const STATUS_VALUES = [
  "Draft",
  "Submitted",
  "Under Review",
  "Selected",
  "Rejected",
  "Active",
  "Completed",
  "Cancelled",
];

const applicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, required: true, unique: true }, // e.g. INT-2026-00001
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", required: true },
    duration: { type: mongoose.Schema.Types.ObjectId, ref: "Duration", required: true },

    status: { type: String, enum: STATUS_VALUES, default: "Submitted" },
    statusHistory: [
      {
        status: { type: String, enum: STATUS_VALUES },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],

    startDate: Date,
    endDate: Date,

    paymentStatus: { type: String, enum: ["Pending", "Successful", "Failed", "Refunded", "Cancelled"], default: "Pending" },

    finalReportSubmitted: { type: Boolean, default: false },
    certificateIssued: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
module.exports.STATUS_VALUES = STATUS_VALUES;
