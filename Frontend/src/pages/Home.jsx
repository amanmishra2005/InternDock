import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Award,
  Zap,
  BookOpen,
  Compass,
  Layers,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Code2,
  FileText,
} from "lucide-react";
import DomainCard from "../components/DomainCard";
import CertificatePreview from "../components/CertificatePreview";
import OfferLetterPreview from "../components/OfferLetterPreview";
import api from "../api/axios";

export default function Home() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Credential Preview Tab State
  const [previewTab, setPreviewTab] = useState("certificate");

  useEffect(() => {
    api
      .get("/domains")
      .then((res) => {
        setDomains(res.data);
      })
      .catch((err) => console.error("Error fetching domains:", err))
      .finally(() => setLoading(false));
  }, []);

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === "left" ? -370 : 370;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSubmitting(true);
    try {
      await api.post("/contact", contactForm);
      setContactSubmitted(true);
      setContactForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Error submitting contact form:", err);
      alert(
        "Could not send message. Please try again or email support@interndock.in directly.",
      );
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="home-page">
      {/* 1. HERO SECTION: Animated attractive decent text introducing site */}
      <section className="hero-section">
        <div className="container hero-grid grid-2 align-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-text-col"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="badge-pill badge-pill-cyan"
            >
              <span className="pulse-dot"></span>
              <Sparkles size={14} />
              <span>2026 Cohort Open • All Streams Welcome</span>
            </motion.div>

            <h1 className="hero-heading">
              Build Experience. <br />
              <span className="gradient-text">
                Earn Credentials that Travel.
              </span>
            </h1>

            <p className="hero-subheading">
              InternDock helps students and graduates from every stream turn
              focused project work into credible experience, mentor feedback,
              and verifiable credentials.
            </p>

            <div className="hero-cta-group">
              <Link to="/domains">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn btn-primary btn-glow btn-lg"
                >
                  <span>Explore 25+ Tracks</span>
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
              <Link to="/verify/offer">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn btn-secondary btn-lg"
                >
                  <ShieldCheck size={18} />
                  <span>Verify Credentials</span>
                </motion.button>
              </Link>
            </div>

            {/* Platform Highlights Bar */}
            <div className="metrics-row">
              <motion.div whileHover={{ y: -3 }} className="metric-box">
                <span className="metric-num gradient-text">100%</span>
                <span className="metric-txt">Verifiable Certificate</span>
              </motion.div>
              <motion.div whileHover={{ y: -3 }} className="metric-box">
                <span className="metric-num gradient-text-cyan">25+</span>
                <span className="metric-txt">Tech Domains</span>
              </motion.div>
              <motion.div whileHover={{ y: -3 }} className="metric-box">
                <span className="metric-num gradient-text-emerald">
                  Self-Paced
                </span>
                <span className="metric-txt">Learn Anytime</span>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="hero-media-col"
          >
            <div className="hero-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
                alt="InternDock Tech Talent Workspace"
                className="hero-main-img"
              />
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="floating-badge badge-top-right"
              >
                <span className="badge-icon">
                  <Zap size={22} color="#d97706" />
                </span>
                <div>
                  <strong>Guaranteed Selection Letter</strong>
                  <span>Direct HR Ledger Verification</span>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.6,
                }}
                className="floating-badge badge-bottom-left"
              >
                <span className="badge-icon">
                  <Award size={22} color="#7c3aed" />
                </span>
                <div>
                  <strong>Flexible Program Duration</strong>
                  <span>4, 6, 8, 12 & 24 Weeks</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURES OF SITE SECTION (PLACED ABOVE STEPS AS REQUESTED) */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="badge-pill badge-pill-emerald">
              <Sparkles size={14} />
              <span>Platform Advantage</span>
            </span>
            <h2 className="section-title">Features of InternDock</h2>
            <p className="section-subtitle">
              Built for students and graduates who want practical project
              experience, thoughtful feedback, and verifiable credentials.
            </p>
          </div>

          <div className="grid-3 features-grid">
            {[
              {
                icon: ShieldCheck,
                color: "#4f46e5",
                title: "Verifiable Credentials",
                desc: "Every offer letter and completion certificate includes a public verification URL and QR code for recruiter validation.",
              },
              {
                icon: Code2,
                color: "#7c3aed",
                title: "Weekly Production Capstones",
                desc: "Work on practical projects across technology, design, business, and creative tracks instead of simulated multiple-choice quizzes.",
              },
              {
                icon: Award,
                color: "#059669",
                title: "Accredited Evaluation Reports",
                desc: "Get detailed weekly code reviews and mentor feedback to level up your software architecture skills.",
              },
              {
                icon: Zap,
                color: "#d97706",
                title: "Self-Paced Remote Flexibility",
                desc: "Complete assignments on your schedule with 4, 6, 8, 12, or 24-week flexible duration tracks.",
              },
              {
                icon: Compass,
                color: "#0284c7",
                title: "Specified Custom Track Builder",
                desc: "Need a specialized domain like Game Dev, Systems Rust, or AI Analytics? Create your own customized track instantly.",
              },
              {
                icon: BookOpen,
                color: "#db2777",
                title: "Shareable Digital Certificate",
                desc: "Finish your track and receive a detailed, verifiable completion certificate you can share on LinkedIn, your resume, or with recruiters.",
              },
            ].map((f, idx) => {
              const IconComp = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  whileHover={{ y: -5 }}
                  className="glass-card feature-card-item"
                >
                  <div
                    className="feature-icon-wrapper"
                    style={{ backgroundColor: `${f.color}15`, color: f.color }}
                  >
                    <IconComp size={24} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. HORIZONTAL STEPS / HOW IT WORKS SECTION (ATTRACTIVE HORIZONTAL FLOW) */}
      <section id="how-it-works" className="stepper-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="badge-pill badge-pill-cyan">
              <Layers size={14} />
              <span>Structured Internship Journey</span>
            </span>
            <h2 className="section-title">How InternDock Works</h2>
            <p className="section-subtitle">
              From domain selection to verified completion certificate in 4
              simple horizontal steps.
            </p>
          </div>

          <div className="horizontal-stepper-container">
            {[
              {
                step: "01",
                title: "Select Domain Track",
                desc: "Choose from 25+ tech domains or specify your custom domain track.",
              },
              {
                step: "02",
                title: "Pick Program Duration",
                desc: "Select 4, 6, 8, 12, or 24 weeks track with transparent program fees.",
              },
              {
                step: "03",
                title: "Build Capstone Projects",
                desc: "Submit weekly GitHub code assignments in your candidate workspace.",
              },
              {
                step: "04",
                title: "Earn Verifiable Credentials",
                desc: "Claim cryptographically signed PDF certificate & offer letter.",
              },
            ].map((s, idx) => (
              <React.Fragment key={s.step}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="horizontal-step-card glass-card"
                >
                  <div className="step-header">
                    <span className="step-num-badge">{s.step}</span>
                    <span className="step-tag">Step {idx + 1}</span>
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </motion.div>
                {idx < 3 && (
                  <div className="step-horizontal-arrow-connector">
                    <ChevronRight size={24} color="#6366f1" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 3B. LIVE CREDENTIAL PREVIEWS SECTION (OFFER LETTER & CERTIFICATE WITH CEO SIGNATURE) */}
      <section className="doc-preview-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="badge-pill badge-pill-emerald">
              <ShieldCheck size={14} />
              <span>Credential previews</span>
            </span>
            <h2 className="section-title">Live Credential Previews</h2>
            <p className="section-subtitle">
              See sample previews of the credentials issued after a completed
              InternDock track. Every final document includes a public
              verification record.
            </p>

            <div className="doc-tab-switcher">
              <button
                className={`doc-tab-btn ${previewTab === "certificate" ? "active" : ""}`}
                onClick={() => setPreviewTab("certificate")}
              >
                <Award size={18} />
                <span>Completion Certificate</span>
              </button>
              <button
                className={`doc-tab-btn ${previewTab === "offer" ? "active" : ""}`}
                onClick={() => setPreviewTab("offer")}
              >
                <FileText size={18} />
                <span>Offer Selection Letter</span>
              </button>
            </div>
          </div>

          <div className="doc-preview-container">
            <AnimatePresence mode="wait">
              {previewTab === "certificate" ? (
                <motion.div
                  key="certificate"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <CertificatePreview
                    studentName="Alex Rivera"
                    domainName="Full Stack MERN Web Development"
                    durationLabel="4 Weeks Track"
                    certificateId="CERT-IND-2026-9842"
                    verificationId="sample-cert-verify"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="offer"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <OfferLetterPreview
                    studentName="Alex Rivera"
                    domainName="Full Stack MERN Web Development"
                    durationLabel="4 Weeks Track"
                    referenceId="OFFER-IND-2026-7731"
                    verificationId="sample-offer-verify"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 4. DOMAINS IN SLIDABLE HORIZONTAL FORMAT WITH ANIMATED BORDERS */}
      <section className="horizontal-domains-section">
        <div className="container">
          <div className="section-header-flex">
            <div>
              <span className="badge-pill">
                <Compass size={14} />
                <span>Explore Tracks</span>
              </span>
              <h2 className="section-title">Internship Domains</h2>
              <p className="section-subtitle">
                Slide horizontally to explore all available tech internship
                tracks.
              </p>
            </div>

            <div className="slider-controls-group">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => scrollSlider("left")}
                className="btn btn-secondary slider-nav-btn"
                aria-label="Previous Slide"
              >
                <ChevronLeft size={20} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => scrollSlider("right")}
                className="btn btn-secondary slider-nav-btn"
                aria-label="Next Slide"
              >
                <ChevronRight size={20} />
              </motion.button>
              <Link to="/domains">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  className="btn btn-primary"
                >
                  <span>View All ({domains.length})</span>
                  <ArrowRight size={16} />
                </motion.button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div
              className="glass-panel text-center"
              style={{ padding: "3rem" }}
            >
              <div className="spinner"></div>
              <p>Loading domain catalog...</p>
            </div>
          ) : domains.length === 0 ? (
            <div className="glass-panel text-center domains-empty-state">
              <Compass size={32} className="domains-empty-icon" />
              <h3>No domains loaded yet</h3>
              <p className="color-muted">
                The domain catalog couldn't be reached. Make sure the backend
                API server is running (
                <code>cd backend &amp;&amp; npm run dev</code>) and connected to
                a database — it seeds sample domains automatically on first run.
              </p>
            </div>
          ) : (
            <div className="horizontal-slider-wrapper" ref={sliderRef}>
              <div className="horizontal-slider-track">
                {domains.map((domain, index) => (
                  <div key={domain._id} className="slider-card-item">
                    <DomainCard domain={domain} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. CONTACT PAGE / CONTACT SECTION */}
      <section id="contact" className="contact-section">
        <div className="container">
          <div className="glass-panel contact-card-wrapper grid-2 align-center">
            <div className="contact-info-col">
              <span className="badge-pill badge-pill-cyan">
                <MessageSquare size={14} />
                <span>Get In Touch</span>
              </span>
              <h2>Have Questions? Talk to Our Admissions Team</h2>
              <p>
                Whether you need help selecting a domain track, verifying
                credentials, or setting up a college cohort, we are here 24/7.
              </p>

              <div className="contact-details-stack">
                <div className="contact-detail-item">
                  <Mail className="c-icon" size={20} />
                  <div>
                    <strong>Email Support</strong>
                    <p>
                      <a
                        href="mailto:support@interndock.in"
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        support@interndock.in
                      </a>
                    </p>
                  </div>
                </div>
                <div className="contact-detail-item">
                  <Phone className="c-icon" size={20} />
                  <div>
                    <strong>Direct Line</strong>
                    <p>
                      <a
                        href="tel:+918808307121"
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        +91 8808307121
                      </a>
                    </p>
                  </div>
                </div>
                <div className="contact-detail-item">
                  <MapPin className="c-icon" size={20} />
                  <div>
                    <strong>Registered Operations</strong>
                    <p>Gorakhpur U.P. India</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-col">
              {contactSubmitted ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="contact-success-box text-center"
                >
                  <CheckCircle2
                    size={48}
                    color="#059669"
                    style={{ marginBottom: "1rem" }}
                  />
                  <h3>Message Dispatched to support@interndock.in &amp; support.interndock@gmail.com!</h3>
                  <p>
                    Thank you for reaching out to InternDock. Your inquiry has
                    been sent directly to <strong>support@interndock.in &amp; support.interndock@gmail.com</strong>{" "}
                    and a confirmation has been emailed to you.
                  </p>
                  <button
                    onClick={() => setContactSubmitted(false)}
                    className="btn btn-secondary"
                    style={{ marginTop: "1.5rem" }}
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleContactSubmit}
                  className="contact-main-form"
                >
                  <div className="input-group">
                    <label className="input-label">Your Name</label>
                    <input
                      className="input-field"
                      placeholder="e.g. Alex Morgan"
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <input
                      className="input-field"
                      type="email"
                      placeholder="alex@university.edu"
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Subject</label>
                    <input
                      className="input-field"
                      placeholder="Domain Track Inquiry / Verification / Partner Cohort"
                      value={contactForm.subject}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          subject: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Message</label>
                    <textarea
                      className="textarea-field"
                      rows="4"
                      placeholder="How can we assist you with your internship journey?"
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          message: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="btn btn-primary btn-glow full-width btn-lg"
                    disabled={contactSubmitting}
                  >
                    <span>
                      {contactSubmitting ? "Sending..." : "Send Message"}
                    </span>
                    <Send size={16} />
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .hero-section { padding: 4.5rem 0 3.5rem 0; }
        .hero-grid { gap: 3.5rem; }
        .align-center { align-items: center; }
        .hero-heading { font-size: 3.4rem; font-weight: 900; margin: 1.25rem 0 1rem 0; line-height: 1.18; }
        .hero-subheading { font-size: 1.1rem; color: var(--text-muted); margin-bottom: 2.25rem; line-height: 1.65; max-width: 620px; }
        .hero-cta-group { display: flex; gap: 1.25rem; margin-bottom: 2.75rem; flex-wrap: wrap; }
        .metrics-row { display: flex; gap: 2.5rem; padding-top: 1.75rem; border-top: 1px solid var(--border-color); }
        .metric-box { display: flex; flex-direction: column; }
        .metric-num { font-size: 1.85rem; font-weight: 900; }
        .metric-txt { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
        .hero-image-wrapper { position: relative; }
        .hero-main-img { width: 100%; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); object-fit: cover; height: 420px; }
        .floating-badge { position: absolute; display: flex; align-items: center; gap: 0.85rem; background: #ffffff; border: 1px solid var(--border-color); padding: 0.85rem 1.35rem; border-radius: var(--radius-md); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08); z-index: 10; }
        .badge-top-right { top: -20px; right: -20px; }
        .badge-bottom-left { bottom: -20px; left: -20px; }
        .floating-badge strong { display: block; font-size: 0.85rem; color: #0f172a; }
        .floating-badge span { font-size: 0.75rem; color: var(--text-muted); }
        
        /* Features Section */
        .features-section { padding: 4.5rem 0 3.5rem 0; }
        .features-grid { gap: 1.75rem; margin-top: 2.5rem; }
        .feature-card-item { padding: 2.25rem; display: flex; flex-direction: column; gap: 1rem; }
        .feature-icon-wrapper { width: 48px; height: 48px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; }
        .feature-card-item h3 { font-size: 1.2rem; font-weight: 800; }
        .feature-card-item p { color: var(--text-muted); font-size: 0.925rem; line-height: 1.6; }

        /* Horizontal Stepper Section */
        .stepper-section { padding: 3.5rem 0 4.5rem 0; }
        .section-header { margin-bottom: 3rem; }
        .section-title { font-size: 2.4rem; font-weight: 800; margin: 0.5rem 0 0.25rem 0; }
        .section-subtitle { color: var(--text-muted); font-size: 1rem; }
        
        .horizontal-stepper-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .horizontal-step-card {
          flex: 1;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: #ffffff !important;
          border: 1px solid var(--border-color) !important;
          box-shadow: var(--shadow-card);
        }
        .step-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .step-num-badge {
          font-family: var(--font-heading);
          font-size: 1.8rem;
          font-weight: 900;
          color: var(--primary);
          background: rgba(79, 70, 229, 0.08);
          padding: 0.2rem 0.75rem;
          border-radius: var(--radius-sm);
        }
        .step-tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-subtle);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .horizontal-step-card h3 {
          font-size: 1.15rem;
          font-weight: 800;
        }
        .horizontal-step-card p {
          color: var(--text-muted);
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .step-horizontal-arrow-connector {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 0.25rem;
          opacity: 0.6;
        }

        /* Slidable Horizontal Domains Section */
        .horizontal-domains-section { padding: 4rem 0; }
        .section-header-flex { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 2rem; }
        .slider-controls-group { display: flex; align-items: center; gap: 0.75rem; }
        .slider-nav-btn { width: 44px; height: 44px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .horizontal-slider-wrapper { overflow-x: auto; scroll-behavior: smooth; padding-bottom: 1rem; }
        .horizontal-slider-wrapper::-webkit-scrollbar { height: 6px; }
        .horizontal-slider-wrapper::-webkit-scrollbar-thumb { background: rgba(79, 70, 229, 0.3); border-radius: 10px; }
        .horizontal-slider-track { display: flex; gap: 1.5rem; width: max-content; }
        .slider-card-item { width: 360px; flex-shrink: 0; }

        /* Contact Section */
        .contact-section { padding: 4.5rem 0 6rem 0; }
        .contact-card-wrapper { grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); align-items: start; padding: 2.5rem; gap: 3rem; background: linear-gradient(135deg, #ffffff 0%, rgba(248, 250, 252, 0.9) 100%) !important; }
        .contact-info-col, .contact-form-col { min-width: 0; }
        .contact-info-col h2 { font-size: clamp(1.8rem, 2.8vw, 2.35rem); font-weight: 800; line-height: 1.12; margin: 0.75rem 0 1rem 0; }
        .contact-info-col > p { color: var(--text-muted); font-size: 0.98rem; line-height: 1.55; margin-bottom: 1.75rem; }
        .contact-details-stack { display: flex; flex-direction: column; gap: 1.1rem; }
        .contact-detail-item { display: flex; align-items: flex-start; gap: 1rem; }
        .c-icon { color: var(--primary); margin-top: 3px; flex-shrink: 0; }
        .contact-detail-item strong { color: #0f172a; font-size: 0.95rem; display: block; }
        .contact-detail-item p { font-size: 0.875rem; margin: 0; color: var(--text-muted); }
        .contact-success-box { padding: 3rem 1.5rem; background: rgba(5, 150, 105, 0.05); border: 1px solid rgba(5, 150, 105, 0.2); border-radius: var(--radius-md); }
        .full-width { width: 100%; }
        .contact-main-form { gap: 0.8rem; }
        .contact-main-form .input-group { margin-bottom: 0; }
        .contact-main-form .input-field, .contact-main-form .textarea-field { padding: 0.7rem 0.9rem; }
        .contact-main-form .textarea-field { min-height: 104px; }

        /* Document Preview Section */
        .doc-preview-section { padding: 4rem 0; background: linear-gradient(180deg, rgba(248, 250, 252, 0.5) 0%, rgba(241, 245, 249, 0.8) 100%); border-y: 1px solid var(--border-color); }
        .doc-tab-switcher { display: inline-flex; gap: 0.5rem; background: #ffffff; padding: 0.35rem; border-radius: 9999px; border: 1px solid var(--border-color); box-shadow: var(--shadow-card); margin-top: 1.5rem; }
        .doc-tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.35rem; border-radius: 9999px; border: none; background: transparent; color: var(--text-muted); font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .doc-tab-btn.active { background: #1e3a8a; color: #ffffff; box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25); }
        .doc-preview-container { margin-top: 2rem; }

        @media (max-width: 900px) {
          .hero-heading { font-size: 2.5rem; }
          .metrics-row { flex-direction: column; gap: 1rem; }
          .contact-card-wrapper { padding: 2rem; }
          .contact-card-wrapper { grid-template-columns: 1fr; }
          .badge-top-right, .badge-bottom-left { display: none; }
          .slider-card-item { width: 300px; }
          .horizontal-stepper-container { flex-direction: column; }
          .step-horizontal-arrow-connector { display: none; }
        }
        @media (max-width: 560px) {
          .contact-section { padding: 3rem 0 4rem; }
          .contact-card-wrapper { padding: 1.25rem; gap: 2rem; }
          .contact-info-col h2 { font-size: 1.8rem; }
          .contact-details-stack { gap: 0.9rem; }
        }
      `}</style>
    </div>
  );
}
