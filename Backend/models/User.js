const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String },
    role: { type: String, enum: ["student", "admin", "superadmin"], default: "student" },

    // student profile fields
    college: String,
    course: String,
    branch: String,
    currentYear: String,
    graduationYear: String,
    studentIdNumber: String,
    city: String,
    state: String,
    country: String,
    skills: [String],
    github: String,
    linkedin: String,
    profilePhotoUrl: String,

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
