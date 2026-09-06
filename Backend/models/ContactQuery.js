const mongoose = require("mongoose");

const contactQuerySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: "General Inquiry" },
    message: { type: String, required: true },
    recipientEmail: { type: String, default: "support@interndock.in" },
    status: { type: String, enum: ["Pending", "Responded", "Archived"], default: "Pending" },
  },
  { timestamps: true }
);

contactQuerySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("ContactQuery", contactQuerySchema);
