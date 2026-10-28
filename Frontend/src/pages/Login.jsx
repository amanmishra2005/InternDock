import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Login({ initialMode }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, forgotPassword, resetPassword } = useAuth();

  // Determine initial mode: login, forgot, or reset
  const queryMode = searchParams.get("view") || searchParams.get("mode");
  const isForgotPath =
    location.pathname === "/forgot-password" ||
    initialMode === "forgot" ||
    queryMode === "forgot";

  const [mode, setMode] = useState(isForgotPath ? "forgot" : "login");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Password reset specific state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpInputRefs = useRef([]);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Sync mode with route if navigating between /login and /forgot-password
  useEffect(() => {
    if (location.pathname === "/forgot-password") {
      setMode("forgot");
    }
  }, [location.pathname]);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Auto-focus first OTP box when entering reset step
  useEffect(() => {
    if (mode === "reset") {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [mode]);

  // OTP box keyboard handling
  const handleDigitChange = (index, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setError("");

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
        const updated = [...otpDigits];
        updated[index - 1] = "";
        setOtpDigits(updated);
      } else {
        const updated = [...otpDigits];
        updated[index] = "";
        setOtpDigits(updated);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const chars = pasted.split("");
    const updated = ["", "", "", "", "", ""];
    for (let i = 0; i < 6; i++) {
      updated[i] = chars[i] || "";
    }
    setOtpDigits(updated);
    setError("");
    const nextFocusIdx = Math.min(chars.length, 5);
    otpInputRefs.current[nextFocusIdx]?.focus();
  };

  // Submit 1: Normal Sign In
  const submitLogin = async (e) => {
    e.preventDefault();
    setError("");
    setRequiresVerification(false);
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(
        ["admin", "superadmin"].includes(user.role) ? "/admin" : "/dashboard"
      );
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        setRequiresVerification(true);
        setUnverifiedEmail(err.response?.data?.email || email);
      }
      setError(
        err.response?.data?.message ||
          "Invalid credentials. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  // Submit 2: Request 6-digit Password Reset OTP
  const submitForgotPassword = async (e) => {
    e.preventDefault();
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await forgotPassword(cleanEmail);
      setSuccessMsg(
        res.message || "A 6-digit verification code has been dispatched to your email."
      );
      setCooldown(60);
      setMode("reset");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to send reset code. Please ensure your email is correct."
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend Password Reset OTP
  const handleResendResetOtp = async () => {
    if (cooldown > 0 || resending) return;
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail) return;

    setError("");
    setSuccessMsg("");
    setResending(true);
    try {
      const res = await forgotPassword(cleanEmail);
      setSuccessMsg(
        res.message || "A fresh 6-digit password reset code has been sent."
      );
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend reset code.");
    } finally {
      setResending(false);
    }
  };

  // Submit 3: Verify OTP & Set New Password
  const submitResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanCode = otpDigits.join("").trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({
        email: email.trim().toLowerCase(),
        code: cleanCode,
        newPassword,
      });

      setSuccessMsg("Password reset successfully! Redirecting to workspace...");
      setMode("success");

      // Auto redirect to appropriate dashboard
      setTimeout(() => {
        if (res.user && ["admin", "superadmin"].includes(res.user.role)) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }, 1400);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset password. Please verify the 6-digit code."
      );
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
            <span>Candidate &amp; Admin Portal</span>
          </motion.div>
          <h1 className="auth-visual-title">
            Accelerate Your Tech Career on{" "}
            <span className="gradient-text">InternDock</span>
          </h1>
          <p className="auth-visual-sub">
            Log in to access your capstone assignments, submit weekly code
            projects, view mentor evaluations, and download verified
            certificates.
          </p>

          <div className="auth-illustration-box">
            <img
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80"
              alt="InternDock Tech Candidate Workspace"
              className="auth-art-img"
            />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
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
              <span>Real-Time Code Review &amp; Mentor Feedback</span>
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
          <AnimatePresence mode="wait">
            {/* VIEW 1: SIGN IN */}
            {mode === "login" && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
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

                <form onSubmit={submitLogin} className="auth-main-form">
                  <div className="input-group">
                    <label className="input-label" htmlFor="login-email">
                      Email Address
                    </label>
                    <div className="input-with-icon">
                      <Mail className="field-icon" size={18} />
                      <input
                        id="login-email"
                        className="input-field padded-input"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <div className="label-row-between">
                      <label className="input-label mb-0" htmlFor="login-password">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setSuccessMsg("");
                          setMode("forgot");
                        }}
                        className="forgot-link-btn"
                        id="forgot-password-link"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="input-with-icon">
                      <Lock className="field-icon" size={18} />
                      <input
                        id="login-password"
                        className="input-field padded-input"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="pwd-toggle-btn"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="error-alert-box"
                    >
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {requiresVerification && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="verification-notice-box"
                      style={{
                        background: "rgba(2, 132, 199, 0.12)",
                        border: "1px solid rgba(2, 132, 199, 0.3)",
                        color: "#e0f2fe",
                        padding: "0.85rem",
                        borderRadius: "var(--radius-sm)",
                        marginBottom: "1.25rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      <p style={{ margin: "0 0 0.5rem 0" }}>
                        Your account is registered but email verification is pending.
                      </p>
                      <Link
                        to={`/register?verify=true&email=${encodeURIComponent(
                          unverifiedEmail || email
                        )}`}
                        className="btn btn-secondary btn-sm"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.8rem",
                        }}
                      >
                        <span>Enter Verification Code</span>
                        <ArrowRight size={14} />
                      </Link>
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="btn btn-primary btn-glow full-width btn-lg"
                    disabled={loading}
                    id="login-submit-btn"
                  >
                    <span>
                      {loading ? "Authenticating..." : "Sign In to Workspace"}
                    </span>
                    <ArrowRight size={18} />
                  </motion.button>
                </form>

                <div className="auth-card-footer text-center">
                  <p>New candidate on InternDock?</p>
                  <Link
                    to="/register"
                    className="gradient-text font-weight-700 footer-link"
                  >
                    <span>Create Free Student Account</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </motion.div>
            )}

            {/* VIEW 2: FORGOT PASSWORD (REQUEST CODE) */}
            {mode === "forgot" && (
              <motion.div
                key="forgot-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="auth-form-header text-center">
                  <div className="auth-logo-center">
                    <div className="icon-badge-round">
                      <KeyRound size={28} color="#38bdf8" />
                    </div>
                  </div>
                  <h2>Reset Your Password</h2>
                  <p>
                    Enter your registered email address and we'll send you a 6-digit
                    code to set a new password.
                  </p>
                </div>

                <form onSubmit={submitForgotPassword} className="auth-main-form">
                  <div className="input-group">
                    <label className="input-label" htmlFor="forgot-email">
                      Registered Email Address
                    </label>
                    <div className="input-with-icon">
                      <Mail className="field-icon" size={18} />
                      <input
                        id="forgot-email"
                        className="input-field padded-input"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                        autoComplete="email"
                      />
                    </div>
                    <span className="field-subtext">
                      We'll dispatch a 6-digit security code valid for 15 minutes.
                    </span>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="error-alert-box"
                    >
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="btn btn-primary btn-glow full-width btn-lg"
                    disabled={loading}
                    id="send-reset-code-btn"
                  >
                    <span>{loading ? "Sending Code..." : "Send Reset Code"}</span>
                    <ArrowRight size={18} />
                  </motion.button>

                  <div className="text-center" style={{ marginTop: "1.25rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccessMsg("");
                        setMode("login");
                      }}
                      className="back-link-btn"
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>

                <div className="auth-card-footer text-center">
                  <p>Remembered your password?</p>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccessMsg("");
                      setMode("login");
                    }}
                    className="footer-link-action"
                  >
                    <span>Return to Login</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* VIEW 3: ENTER OTP & NEW PASSWORD */}
            {mode === "reset" && (
              <motion.div
                key="reset-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="auth-form-header text-center">
                  <div className="auth-logo-center">
                    <div className="icon-badge-round icon-badge-indigo">
                      <Lock size={28} color="#818cf8" />
                    </div>
                  </div>
                  <h2>Set New Password</h2>
                  <p>Enter the 6-digit code sent to your inbox and your new password.</p>
                </div>

                <form onSubmit={submitResetPassword} className="auth-main-form">
                  {/* Email Chip */}
                  <div className="email-chip-box">
                    <div className="email-chip-icon">
                      <Mail size={16} />
                    </div>
                    <div className="email-chip-content">
                      <span className="email-chip-label">Code dispatched to:</span>
                      <strong className="email-chip-address">{email}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError("");
                        setSuccessMsg("");
                      }}
                      className="email-chip-change-btn"
                    >
                      Change
                    </button>
                  </div>

                  {/* 6-Digit OTP */}
                  <div className="otp-box-section">
                    <div className="otp-boxes-label-row">
                      <KeyRound size={16} className="otp-label-icon" />
                      <label className="input-label mb-0">6-Digit Verification Code</label>
                    </div>
                    <div className="otp-boxes-container" onPaste={handlePaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          autoComplete="off"
                          className={`otp-box-digit ${digit ? "filled" : ""}`}
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                          aria-label={`Digit ${idx + 1}`}
                        />
                      ))}
                    </div>
                    <span className="field-subtext text-center">
                      Check your inbox or Spam/Promotions folder.
                    </span>
                  </div>

                  {/* New Password */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="reset-new-password">
                      New Password (min. 8 characters)
                    </label>
                    <div className="input-with-icon">
                      <Lock className="field-icon" size={18} />
                      <input
                        id="reset-new-password"
                        className="input-field padded-input"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Create strong password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="pwd-toggle-btn"
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="reset-confirm-password">
                      Confirm New Password
                    </label>
                    <div className="input-with-icon">
                      <Lock className="field-icon" size={18} />
                      <input
                        id="reset-confirm-password"
                        className="input-field padded-input"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-type new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="pwd-toggle-btn"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="error-alert-box"
                    >
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="success-alert-box"
                    >
                      <CheckCircle2 size={16} />
                      <span>{successMsg}</span>
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="btn btn-primary btn-glow full-width btn-lg"
                    disabled={loading}
                    id="reset-password-submit-btn"
                  >
                    <span>
                      {loading ? "Updating Password..." : "Update Password & Sign In"}
                    </span>
                    <ArrowRight size={18} />
                  </motion.button>

                  {/* Resend Cooldown Section */}
                  <div className="resend-box text-center">
                    <p>Didn't receive the code?</p>
                    <button
                      type="button"
                      onClick={handleResendResetOtp}
                      disabled={cooldown > 0 || resending}
                      className="resend-action-btn"
                      id="resend-reset-code-btn"
                    >
                      <RotateCcw
                        size={14}
                        className={resending ? "spinner-inline" : ""}
                      />
                      <span>
                        {resending
                          ? "Sending code..."
                          : cooldown > 0
                          ? `Resend code in ${cooldown}s`
                          : "Resend Code"}
                      </span>
                    </button>
                  </div>

                  <div className="text-center" style={{ marginTop: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccessMsg("");
                        setMode("login");
                      }}
                      className="back-link-btn"
                    >
                      <ArrowLeft size={16} />
                      <span>Cancel &amp; Back to Sign In</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* VIEW 4: SUCCESS CONFIRMATION */}
            {mode === "success" && (
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center"
                style={{ padding: "1.5rem 0" }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "2px solid #10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.5rem auto",
                    color: "#10b981",
                  }}
                >
                  <CheckCircle2 size={40} />
                </div>
                <h2 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
                  Password Reset Successful!
                </h2>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                  Your password has been securely updated. Redirecting you into your
                  workspace...
                </p>
                <div className="spinner" style={{ margin: "0 auto" }} />
              </motion.div>
            )}
          </AnimatePresence>
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
        .icon-badge-round {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: rgba(56, 189, 248, 0.12);
          border: 1.5px solid rgba(56, 189, 248, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-badge-indigo {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.35);
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
        .label-row-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .forgot-link-btn {
          background: none;
          border: none;
          color: #38bdf8;
          font-size: 0.825rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .forgot-link-btn:hover {
          color: #7dd3fc;
          text-decoration: underline;
        }
        .back-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .back-link-btn:hover {
          color: #ffffff;
        }
        .footer-link-action {
          background: none;
          border: none;
          color: #38bdf8;
          font-weight: 700;
          cursor: pointer;
          margin-top: 0.4rem;
          font-size: 0.9rem;
        }
        .footer-link-action:hover {
          text-decoration: underline;
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
        .field-subtext {
          font-size: 0.775rem;
          color: var(--text-muted);
          margin-top: 0.35rem;
          display: block;
        }
        .error-alert-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1.25rem;
          font-size: 0.875rem;
        }
        .success-alert-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
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

        /* OTP & Chip Styling */
        .email-chip-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(2, 132, 199, 0.1);
          border: 1.5px solid rgba(2, 132, 199, 0.3);
          padding: 0.85rem 1.15rem;
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
        }
        .email-chip-icon {
          color: #38bdf8;
          display: flex;
        }
        .email-chip-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          font-size: 0.85rem;
        }
        .email-chip-label {
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 500;
        }
        .email-chip-address {
          color: #ffffff !important;
          font-size: 0.95rem;
          font-weight: 700;
          word-break: break-all;
        }
        .email-chip-change-btn {
          background: none;
          border: none;
          color: #38bdf8;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
        }
        .otp-box-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.5rem;
          width: 100%;
        }
        .otp-boxes-label-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: #ffffff;
          font-size: 0.92rem;
          font-weight: 700;
        }
        .otp-label-icon {
          color: #818cf8;
        }
        .otp-boxes-container {
          display: flex;
          gap: 0.65rem;
          justify-content: center;
          margin-bottom: 0.65rem;
          width: 100%;
        }
        .otp-box-digit {
          width: 50px;
          height: 58px;
          text-align: center;
          font-size: 1.75rem;
          font-weight: 800;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          background: #ffffff;
          border: 2px solid #cbd5e1;
          border-radius: 12px;
          color: #000000 !important;
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .otp-box-digit:focus {
          border-color: #6366f1;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25), 0 4px 12px rgba(99, 102, 241, 0.2);
          transform: translateY(-2px);
          color: #000000 !important;
        }
        .otp-box-digit.filled {
          border-color: #6366f1;
          background: #f8fafc;
          color: #000000 !important;
        }
        .resend-box {
          margin-top: 1.25rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .resend-box p {
          margin-bottom: 0.35rem;
        }
        .resend-action-btn {
          background: none;
          border: none;
          color: #38bdf8;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
        }
        .resend-action-btn:disabled {
          color: var(--text-muted);
          cursor: not-allowed;
          opacity: 0.6;
        }
        .spinner-inline {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .auth-visual-side { display: none; }
        }
        @media (max-width: 600px) {
          .auth-split-wrapper { padding: 2rem 0; }
          .auth-form-side { padding: 1.5rem 1.15rem; border-radius: var(--radius-md); }
          .auth-form-header h2 { font-size: 1.55rem; }
          .auth-form-header p { font-size: 0.85rem; margin-bottom: 1.25rem; }
          .otp-boxes-container { gap: 0.35rem; }
          .otp-box-digit { width: 42px; height: 50px; font-size: 1.35rem; border-radius: 8px; }
        }
      `}</style>
    </div>
  );
}
