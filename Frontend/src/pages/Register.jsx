import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Phone,
  GraduationCap,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialVerify = searchParams.get("verify") === "true";

  const [step, setStep] = useState(initialVerify && initialEmail ? "verify" : "register");
  const [form, setForm] = useState({
    fullName: "",
    email: initialEmail,
    password: "",
    phone: "",
    college: "",
  });
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpInputRefs = useRef([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Auto-focus first OTP box when entering verify step
  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);


  // Anti-Bot: Honeypot & Timing
  const [honeypot, setHoneypot] = useState("");
  const formStartTimeRef = useRef(Date.now());
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileContainerRef = useRef(null);

  const { register, verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Load Cloudflare Turnstile if site key is configured
  useEffect(() => {
    const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;
    if (!siteKey || step !== "register") return;

    const scriptId = "cloudflare-turnstile-script";
    let script = document.getElementById(scriptId);

    const renderWidget = () => {
      if (window.turnstile && turnstileContainerRef.current) {
        try {
          window.turnstile.render(turnstileContainerRef.current, {
            sitekey: siteKey,
            theme: "dark",
            callback: (token) => setTurnstileToken(token),
            "expired-callback": () => setTurnstileToken(""),
            "error-callback": () => setTurnstileToken(""),
          });
        } catch (e) {
          // ignore already rendered
        }
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.body.appendChild(script);
    } else {
      renderWidget();
    }
  }, [step]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Step 1: Submit Registration
  const submitRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        hp_website: honeypot,
        formStartTime: formStartTimeRef.current,
        turnstileToken,
      };

      const res = await register(payload);
      if (res.requiresVerification) {
        setStep("verify");
        setSuccessMsg(res.message || "Verification code sent to your email!");
        setCooldown(60);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Digit Input Handlers
  const handleDigitChange = (index, value) => {
    const numericChar = value.replace(/\D/g, "");
    if (!numericChar) {
      const updated = [...otpDigits];
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }
    const char = numericChar.slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);
    setError("");

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const updated = [...otpDigits];
        updated[index - 1] = "";
        setOtpDigits(updated);
        otpInputRefs.current[index - 1]?.focus();
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

  // Step 2: Verify 6-digit Email OTP
  const submitVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanCode = otpDigits.join("").trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmail(form.email, cleanCode);
      setSuccessMsg("✓ Email verified successfully! Redirecting to your dashboard...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please check your code.");
    } finally {
      setLoading(false);
    }
  };


  // Resend OTP
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setError("");
    setSuccessMsg("");
    setResending(true);
    try {
      const res = await resendVerification(form.email);
      setSuccessMsg(res.message || "A fresh 6-digit verification code has been dispatched.");
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend verification code.");
    } finally {
      setResending(false);
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
            <span>Candidate Verification &amp; Security</span>
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
              <span>Mandatory email verification for verified student credentials</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="feature-icon" />
              <span>Protected against bot manipulation &amp; fake registrations</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="feature-icon" />
              <span>Immediate access to domain milestone repositories upon verification</span>
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

            {step === "register" ? (
              <>
                <h2>Create Candidate Account</h2>
                <p>Register with your permanent academic or personal email to begin</p>
              </>
            ) : (
              <>
                <h2>Verify Your Email</h2>
                <p>Enter the 6-digit activation code sent to activate your account</p>
              </>
            )}
          </div>

          <AnimatePresence mode="wait">
            {step === "register" ? (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                onSubmit={submitRegister}
                className="auth-main-form"
              >
                {/* Honeypot anti-bot decoy field (invisible to users) */}
                <div style={{ display: "none" }} aria-hidden="true">
                  <input
                    type="text"
                    name="hp_website"
                    tabIndex="-1"
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

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
                  <label className="input-label">Email Address (Permanent Inbox)</label>
                  <div className="input-with-icon">
                    <Mail className="field-icon" size={18} />
                    <input
                      className="input-field padded-input"
                      type="email"
                      placeholder="alex@university.edu or alex@gmail.com"
                      value={form.email}
                      onChange={update("email")}
                      required
                    />
                  </div>
                  <span className="field-subtext">Disposable or temporary emails are blocked.</span>
                </div>

                <div className="input-group">
                  <label className="input-label">Password (Min. 8 characters)</label>
                  <div className="input-with-icon">
                    <Lock className="field-icon" size={18} />
                    <input
                      className="input-field padded-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={form.password}
                      onChange={update("password")}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="pwd-toggle-btn"
                      aria-label="Toggle password visibility"
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

                {/* Cloudflare Turnstile Container (if configured) */}
                <div ref={turnstileContainerRef} className="turnstile-container"></div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="error-alert-box">
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
                >
                  <span>{loading ? "Verifying..." : "Continue to Email Verification"}</span>
                  <ArrowRight size={18} />
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="verify-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                onSubmit={submitVerify}
                className="auth-main-form"
              >
                <div className="email-chip-box">
                  <div className="email-chip-icon">
                    <Mail size={16} />
                  </div>
                  <div className="email-chip-content">
                    <span className="email-chip-label">Code dispatched to:</span>
                    <strong className="email-chip-address">{form.email}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("register");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="email-chip-change-btn"
                  >
                    Change
                  </button>
                </div>

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
                    Check your inbox or Spam/Updates folder. Valid for 15 minutes.
                  </span>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="error-alert-box">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}

                {successMsg && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="success-alert-box">
                    <CheckCircle2 size={16} />
                    <span>{successMsg}</span>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="btn btn-primary btn-glow full-width btn-lg"
                  disabled={loading || otpDigits.join("").length !== 6}
                >
                  <span>{loading ? "Activating Account..." : "Verify & Activate Account"}</span>
                  <ShieldCheck size={18} />
                </motion.button>


                <div className="resend-box text-center">
                  <p>Didn't receive the email code?</p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || resending}
                    className="resend-action-btn"
                  >
                    <RotateCcw size={14} className={resending ? "spinner-inline" : ""} />
                    <span>
                      {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? "Resending..." : "Resend Code"}
                    </span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

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
        .feature-icon { color: #34d399; flex-shrink: 0; }
        .auth-form-side { padding: 3rem; }
        .auth-logo-center { display: flex; justify-content: center; margin-bottom: 0.75rem; filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.35)); }
        .auth-form-header h2 { font-size: 1.85rem; font-weight: 800; }
        .auth-form-header p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
        .input-with-icon { position: relative; display: flex; align-items: center; }
        .field-icon { position: absolute; left: 1rem; color: var(--text-muted); pointer-events: none; }
        .padded-input { padding-left: 2.8rem !important; }
        .pwd-toggle-btn { position: absolute; right: 0.85rem; background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .field-subtext { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem; display: block; }
        .error-alert-box { display: flex; align-items: center; gap: 0.5rem; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; font-size: 0.875rem; }
        .success-alert-box { display: flex; align-items: center; gap: 0.5rem; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; font-size: 0.875rem; }
        .auth-card-footer { margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid rgba(255, 255, 255, 0.06); font-size: 0.9rem; color: var(--text-muted); }
        .footer-link { display: inline-flex; align-items: center; gap: 0.4rem; margin-top: 0.4rem; }
        .full-width { width: 100%; }
        .turnstile-container { margin: 1rem 0; min-height: 65px; display: flex; justify-content: center; }
        
        .email-chip-box { display: flex; align-items: center; gap: 0.75rem; background: #f0f9ff; border: 1.5px solid #bae6fd; padding: 0.85rem 1.15rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; }
        .email-chip-icon { color: #0284c7; display: flex; }
        .email-chip-content { flex: 1; display: flex; flex-direction: column; font-size: 0.85rem; }
        .email-chip-label { color: #475569; font-size: 0.78rem; font-weight: 500; }
        .email-chip-address { color: #000000 !important; font-size: 0.95rem; font-weight: 700; word-break: break-all; }
        .email-chip-change-btn { background: none; border: none; color: #0284c7; font-size: 0.85rem; font-weight: 700; cursor: pointer; text-decoration: underline; }
        .otp-box-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 1.5rem; width: 100%; }
        .otp-boxes-label-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; color: #000000; font-size: 0.92rem; font-weight: 700; }
        .otp-label-icon { color: #4f46e5; }
        .mb-0 { margin-bottom: 0 !important; }
        .otp-boxes-container { display: flex; gap: 0.65rem; justify-content: center; margin-bottom: 0.65rem; width: 100%; }
        .otp-box-digit {
          width: 52px;
          height: 60px;
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
          border-color: #4f46e5;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2), 0 4px 12px rgba(79, 70, 229, 0.15);
          transform: translateY(-2px);
          color: #000000 !important;
        }
        .otp-box-digit.filled {
          border-color: #4f46e5;
          background: #f8fafc;
          color: #000000 !important;
        }
        @media (max-width: 480px) {
          .otp-boxes-container { gap: 0.35rem; }
          .otp-box-digit { width: 44px; height: 52px; font-size: 1.4rem; border-radius: 8px; }
        }
        .resend-box { margin-top: 1.25rem; font-size: 0.85rem; color: var(--text-muted); }

        .resend-box p { margin-bottom: 0.35rem; }
        .resend-action-btn { background: none; border: none; color: #0284c7; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; }
        .resend-action-btn:disabled { color: var(--text-muted); cursor: not-allowed; opacity: 0.6; }
        .spinner-inline { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .auth-visual-side { display: none; }
        }
        @media (max-width: 600px) {
          .auth-split-wrapper { padding: 2rem 0; }
          .auth-form-side { padding: 1.5rem 1.15rem; border-radius: var(--radius-md); }
          .auth-form-header h2 { font-size: 1.55rem; }
          .auth-form-header p { font-size: 0.85rem; margin-bottom: 1.25rem; }
        }
      `}</style>
    </div>
  );
}
