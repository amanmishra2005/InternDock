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
    studentName: { type: String, trim: true },
    studentEmail: { type: String, trim: true },
    collegeName: { type: String, trim: true },
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
    offerLetterIssued: { type: Boolean, default: false },
    offerLetterRef: { type: String, trim: true },
    certificateIssued: { type: Boolean, default: false },
    certificateId: { type: String, trim: true },
  },
  { timestamps: true }
);

applicationSchema.index({ student: 1, createdAt: -1 });
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ domain: 1, status: 1 });

// Keep status history lean in MongoDB Atlas (max 10 transitions; historical audit is in Google Sheets)
applicationSchema.pre("save", function (next) {
  if (Array.isArray(this.statusHistory) && this.statusHistory.length > 10) {
    this.statusHistory = this.statusHistory.slice(-10);
  }
  next();
});

module.exports = mongoose.model("Application", applicationSchema);
module.exports.STATUS_VALUES = STATUS_VALUES;
