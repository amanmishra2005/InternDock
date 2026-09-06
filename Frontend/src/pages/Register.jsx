import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, GraduationCap, Eye, EyeOff, Sparkles, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Register() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", college: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register(form);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      <div className="container auth-split-grid grid-2 align-center">
        {/* Left Side Visual Illustration Card */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="auth-visual-side glass-panel"
        >
          <motion.div 
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="badge-pill badge-pill-emerald"
          >
            <span className="pulse-dot"></span>
            <ShieldCheck size={14} />
            <span>Candidate Registration</span>
          </motion.div>

          <h1 className="auth-visual-title">
            Join <span className="gradient-text">InternDock</span> Internship Platform
          </h1>
          <p className="auth-visual-sub">
            Enroll in hands-on tech internships across 25+ domains, work on real-world capstone projects, and build a cryptographically verified portfolio.
          </p>

          <div className="auth-illustration-box">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80" 
              alt="InternDock Student Tech Cohort" 
              className="auth-art-img" 
            />
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="auth-art-badge"
            >
              <span className="pulse-dot"></span>
              <Sparkles size={14} color="#34d399" />
              <span>100% Verifiable Credentials</span>
            </motion.div>
          </div>

          <div className="auth-features-list">
            <div className="feature-item">
              <CheckCircle2 size={16} className="feature-icon" />
              <span>Instant Access to Domain Task Repositories</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="feature-icon" />
              <span>Automated Verification QR Code Generation</span>
            </div>
          </div>
        </motion.div>

        {/* Right Form Card */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="auth-form-side glass-panel"
        >
          <div className="auth-form-header text-center">
            <motion.div
              className="auth-logo-center"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Logo size={56} />
            </motion.div>
            <h2>Create Candidate Account</h2>
            <p>Create your account and start your certificate track on InternDock</p>
          </div>

          <form onSubmit={submit} className="auth-main-form">
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div className="input-with-icon">
                <User className="field-icon" size={18} />
                <input
                  className="input-field padded-input"
                  placeholder="e.g. Alex Morgan"
                  value={form.fullName}
                  onChange={update("fullName")}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="input-with-icon">
                <Mail className="field-icon" size={18} />
                <input
                  className="input-field padded-input"
                  type="email"
                  placeholder="alex@university.edu"
                  value={form.email}
                  onChange={update("email")}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-with-icon">
                <Lock className="field-icon" size={18} />
                <input
                  className="input-field padded-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
                  value={form.password}
                  onChange={update("password")}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pwd-toggle-btn"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Phone Number (Optional)</label>
                <div className="input-with-icon">
                  <Phone className="field-icon" size={18} />
                  <input
                    className="input-field padded-input"
                    placeholder="+91 9876543210"
                    value={form.phone}
                    onChange={update("phone")}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Institution / College</label>
                <div className="input-with-icon">
                  <GraduationCap className="field-icon" size={18} />
                  <input
                    className="input-field padded-input"
                    placeholder="e.g. Tech University"
                    value={form.college}
                    onChange={update("college")}
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="error-alert-box">
                {error}
              </motion.div>
            )}

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn btn-primary btn-glow full-width btn-lg" 
              disabled={loading}
            >
              <span>{loading ? "Creating Account..." : "Create Account & Start Internship"}</span>
              <ArrowRight size={18} />
            </motion.button>
          </form>

          <div className="auth-card-footer text-center">
            <p>Already registered on InternDock?</p>
            <Link to="/login" className="gradient-text font-weight-700 footer-link">
              <span>Sign In to Workspace</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>
      </div>

      <style>{`
        .auth-split-wrapper { padding: 4rem 0; }
        .auth-split-grid { gap: 3rem; }
        .auth-visual-side { padding: 3rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .auth-visual-title { font-size: 2.3rem; font-weight: 800; line-height: 1.2; }
        .auth-visual-sub { color: var(--text-muted); font-size: 1rem; line-height: 1.6; }
        .auth-illustration-box { position: relative; margin-top: 1rem; }
        .auth-art-img { width: 100%; height: 310px; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--border-color); }
        .auth-art-badge { position: absolute; bottom: 18px; left: 18px; display: flex; align-items: center; gap: 0.6rem; background: rgba(11, 15, 28, 0.92); border: 1px solid var(--border-color); backdrop-filter: blur(12px); padding: 0.5rem 1rem; border-radius: var(--radius-full); font-size: 0.825rem; color: #ffffff; font-weight: 600; }
        .auth-features-list { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.5rem; }
        .feature-item { display: flex; align-items: center; gap: 0.6rem; font-size: 0.875rem; color: var(--text-muted); }
        .feature-icon { color: #34d399; }
        .auth-form-side { padding: 3rem; }
        .auth-logo-center { display: flex; justify-content: center; margin-bottom: 0.75rem; filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.35)); }
        .auth-form-header h2 { font-size: 1.85rem; font-weight: 800; }
        .auth-form-header p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
        .input-with-icon { position: relative; display: flex; align-items: center; }
        .field-icon { position: absolute; left: 1rem; color: var(--text-muted); pointer-events: none; }
        .padded-input { padding-left: 2.8rem !important; }
        .pwd-toggle-btn { position: absolute; right: 0.85rem; background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .error-alert-box { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; font-size: 0.875rem; }
        .auth-card-footer { margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid rgba(255, 255, 255, 0.06); font-size: 0.9rem; color: var(--text-muted); }
        .footer-link { display: inline-flex; align-items: center; gap: 0.4rem; margin-top: 0.4rem; }
        .full-width { width: 100%; }
        @media (max-width: 900px) { .auth-visual-side { display: none; } }
      `}</style>
    </div>
  );
}
