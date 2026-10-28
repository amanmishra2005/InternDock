const mongoose = require("mongoose");

const domainSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, default: "General" }, // e.g. Software Development, Data & AI, Cloud & DevOps
    description: { type: String, default: "" },
    icon: { type: String, default: "code" },
    skills: [String],
    prerequisites: [String],
    availableDurations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Duration" }],
    isActive: { type: Boolean, default: true },
    isPersonalized: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

domainSchema.index({ isActive: 1, isPersonalized: 1, isPublic: 1 });
domainSchema.index({ createdBy: 1, isPersonalized: 1 });

module.exports = mongoose.model("Domain", domainSchema);
