import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Sparkles, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      localStorage.setItem("user", JSON.stringify(user));
      navigate(["admin", "superadmin"].includes(user.role) ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      <div className="container auth-split-grid grid-2 align-center">
        {/* Left Visual Illustration Card */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="auth-visual-side glass-panel"
        >
          <motion.div 
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="badge-pill badge-pill-cyan"
          >
            <span className="pulse-dot"></span>
            <ShieldCheck size={14} />
            <span>Candidate & Admin Portal</span>
          </motion.div>
          <h1 className="auth-visual-title">
            Accelerate Your Tech Career on <span className="gradient-text">InternDock</span>
          </h1>
          <p className="auth-visual-sub">
            Log in to access your capstone assignments, submit weekly code projects, view mentor evaluations, and download verified certificates.
          </p>

          <div className="auth-illustration-box">
            <img 
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80" 
              alt="InternDock Tech Candidate Workspace" 
              className="auth-art-img" 
            />
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="auth-art-badge"
            >
              <span className="pulse-dot"></span>
              <Sparkles size={14} color="#a855f7" />
              <span>100% Verifiable Certificates</span>
            </motion.div>
          </div>

          <div className="auth-features-list">
            <div className="feature-item">
              <CheckCircle2 size={16} className="feature-icon" />
              <span>Cryptographically Signed Internship Certificates</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="feature-icon" />
              <span>Real-Time Code Review & Mentor Feedback</span>
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
            <h2>Sign In to Workspace</h2>
            <p>Enter your account credentials to access your dashboard</p>
          </div>

          <form onSubmit={submit} className="auth-main-form">
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="input-with-icon">
                <Mail className="field-icon" size={18} />
                <input
                  className="input-field padded-input"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              <span>{loading ? "Authenticating..." : "Sign In to Workspace"}</span>
              <ArrowRight size={18} />
            </motion.button>
          </form>

          <div className="auth-card-footer text-center">
            <p>New candidate on InternDock?</p>
            <Link to="/register" className="gradient-text font-weight-700 footer-link">
              <span>Create Free Student Account</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.div>
      </div>

      <style>{`
        .auth-split-wrapper {
          padding: 4rem 0;
        }
        .auth-split-grid {
          gap: 3rem;
        }
        .auth-visual-side {
          padding: 3rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .auth-visual-title {
          font-size: 2.3rem;
          font-weight: 800;
          line-height: 1.2;
        }
        .auth-visual-sub {
          color: var(--text-muted);
          font-size: 1rem;
          line-height: 1.6;
        }
        .auth-illustration-box {
          position: relative;
          margin-top: 1rem;
        }
        .auth-art-img {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }
        .auth-art-badge {
          position: absolute;
          bottom: 18px;
          left: 18px;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: rgba(11, 15, 28, 0.92);
          border: 1px solid var(--border-color);
          backdrop-filter: blur(12px);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.825rem;
          color: #ffffff;
          font-weight: 600;
        }
        .auth-features-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-top: 0.5rem;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .feature-icon {
          color: #34d399;
        }
        .auth-form-side {
          padding: 3rem;
        }
        .auth-logo-center {
          display: flex;
          justify-content: center;
          margin-bottom: 0.75rem;
          filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.35));
        }
        .auth-form-header h2 {
          font-size: 1.85rem;
          font-weight: 800;
        }
        .auth-form-header p {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }
        .demo-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          color: #fbbf24;
          font-weight: 700;
          margin-right: 0.3rem;
        }
        .demo-text code {
          background: rgba(0, 0, 0, 0.5);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          color: #38bdf8;
        }
        .btn-demo-fill {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          padding: 0.45rem 0.85rem;
          border-radius: var(--radius-sm);
          font-size: 0.775rem;
          cursor: pointer;
          font-weight: 600;
          white-space: nowrap;
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .field-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
          pointer-events: none;
        }
        .padded-input {
          padding-left: 2.8rem !important;
        }
        .pwd-toggle-btn {
          position: absolute;
          right: 0.85rem;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .error-alert-box {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1.25rem;
          font-size: 0.875rem;
        }
        .auth-card-footer {
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .footer-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-top: 0.4rem;
        }
        .full-width {
          width: 100%;
        }
        @media (max-width: 900px) {
          .auth-visual-side { display: none; }
        }
      `}</style>
    </div>
  );
}
