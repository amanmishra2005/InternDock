import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertTriangle, ShieldCheck, Mail, Phone, MapPin, CheckCircle2, Sparkles, ChevronRight, RefreshCw } from "lucide-react";

export default function RefundPolicy() {
  const [activeTab, setActiveTab] = useState("all");

  const sections = [
    {
      id: "terms",
      icon: AlertTriangle,
      iconColor: "#ef4444",
      badge: "Fee Structure",
      title: "1. Non-Refundable Fee Structure",
      summary: "Program track enrollment fees cover immediate administrative processing, cloud infrastructure allocation, cryptographic indexing, and mentor evaluation setup:",
      bullets: [
        { label: "Strict Non-Refundable Policy:", detail: "Payments made towards internship tracks, selection offer letters, or completion certificate verification cannot be refunded, cancelled, or transferred to another candidate under any circumstances." },
        { label: "Immediate Credential Allocation:", detail: "Upon payment, candidate credentials and selection letters are immediately registered on www.interndock.in and bound to cryptographic hashes, incurring non-recoverable infrastructure processing costs." },
        { label: "Track Fee Breakdown:", detail: "₹100 (4 Weeks Track), ₹150 (6 Weeks Track), ₹200 (8 Weeks Track), ₹300 (12 Weeks Track), ₹500 (24 Weeks Track)." }
      ]
    },
    {
      id: "exception",
      icon: RefreshCw,
      iconColor: "#10b981",
      badge: "Glitch Exception",
      title: "2. Payment Gateway Network Error Exception",
      summary: "We protect candidates against unexpected payment gateway errors:",
      bullets: [
        { label: "Duplicate Charge Refund:", detail: "In the rare event of a duplicate payment caused by a bank or payment gateway network error, duplicate charges will be refunded 100% upon verifying transaction IDs with our support desk." },
        { label: "Resolution Timeline:", detail: "Verified duplicate transaction refunds are processed back to the original payment source within 3-5 business days." }
      ]
    },
    {
      id: "contact",
      icon: Phone,
      iconColor: "#4f46e5",
      badge: "Support Desk",
      title: "3. Direct Line Support & Payment Desk",
      summary: "If you have transaction inquiries or need assistance with your UTR payment registration, reach out directly to our support desk:",
      contactBoxes: [
        { icon: Mail, label: "Official Support Email", val: "support@interndock.in", link: "mailto:support@interndock.in" },
        { icon: Phone, label: "Direct Support Line", val: "+91 8808307121", link: "tel:+918808307121" },
        { icon: MapPin, label: "Registered Operations", val: "Gorakhpur U.P. India", link: null }
      ]
    }
  ];

  const filteredSections = activeTab === "all" ? sections : sections.filter(s => s.id === activeTab);

  return (
    <div className="policy-redesign-wrapper">
      <div className="policy-ambient-bg" aria-hidden="true" style={{ background: "radial-gradient(circle at 10% 20%, rgba(239, 68, 68, 0.06), transparent 40%), radial-gradient(circle at 90% 80%, rgba(79, 70, 229, 0.06), transparent 40%)" }} />

      <div className="container policy-container">
        {/* Top Link */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link to="/" className="policy-back-btn">
            <ArrowLeft size={16} />
            <span>Back to Main Platform</span>
          </Link>
        </motion.div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="policy-hero-banner glass-panel"
          style={{ borderLeftColor: "#ef4444" }}
        >
          <div className="hero-top-badges">
            <span className="badge-pill badge-pill-rose">
              <AlertTriangle size={14} />
              <span>Program Fee Protocol</span>
            </span>
            <span className="badge-pill badge-pill-amber">
              <Sparkles size={14} />
              <span>Govt. MSME Registered Enterprise</span>
            </span>
          </div>

          <h1 className="policy-hero-heading">
            No Refund &amp; <br />
            <span className="gradient-text-amber">Program Fee Policy</span>
          </h1>

          <p className="policy-hero-sub">
            All program enrollment, domain registration, mentor evaluation, and document verification fees submitted to <strong>InternDock</strong> are non-refundable once an application is registered or credentials are unlocked.
          </p>

          <div className="policy-meta-row">
            <div className="meta-item">
              <strong>Effective Date:</strong> September 04, 2026
            </div>
            <div className="meta-divider">•</div>
            <div className="meta-item">
              <strong>Regd. Enterprise:</strong> Ministry of MSME
            </div>
            <div className="meta-divider">•</div>
            <div className="meta-item">
              <strong>Operations:</strong> Gorakhpur U.P. India
            </div>
          </div>
        </motion.div>

        {/* Interactive Filter Nav */}
        <div className="policy-tab-nav">
          <button
            className={`policy-nav-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <span>Overview &amp; Fee Terms</span>
          </button>
          {sections.map(s => (
            <button
              key={s.id}
              className={`policy-nav-tab ${activeTab === s.id ? "active" : ""}`}
              onClick={() => setActiveTab(s.id)}
            >
              <s.icon size={15} style={{ color: s.iconColor }} />
              <span>{s.badge}</span>
            </button>
          ))}
        </div>

        {/* Layout Grid */}
        <div className="policy-layout-grid">
          <div className="policy-sections-col">
            <AnimatePresence mode="wait">
              {filteredSections.map((sec, idx) => {
                const IconComponent = sec.icon;
                return (
                  <motion.div
                    key={sec.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35, delay: idx * 0.08 }}
                    whileHover={{ y: -3 }}
                    className="policy-card-block glass-panel"
                  >
                    <div className="card-top-header">
                      <div className="icon-badge-box" style={{ background: `${sec.iconColor}15`, border: `1px solid ${sec.iconColor}30` }}>
                        <IconComponent size={22} style={{ color: sec.iconColor }} />
                      </div>
                      <div>
                        <span className="card-tag" style={{ color: sec.iconColor }}>{sec.badge}</span>
                        <h2 className="card-title">{sec.title}</h2>
                      </div>
                    </div>

                    <p className="card-summary">{sec.summary}</p>

                    {sec.bullets && (
                      <div className="policy-bullet-stack">
                        {sec.bullets.map((b, i) => (
                          <div key={i} className="bullet-row-item">
                            <CheckCircle2 size={16} className="bullet-icon" />
                            <div>
                              <strong>{b.label}</strong> {b.detail}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {sec.contactBoxes && (
                      <div className="contact-boxes-grid">
                        {sec.contactBoxes.map((cb, i) => {
                          const CBIcon = cb.icon;
                          return (
                            <div key={i} className="contact-box-item">
                              <CBIcon size={20} color="#4f46e5" />
                              <div>
                                <strong>{cb.label}</strong>
                                {cb.link ? (
                                  <a href={cb.link} className="contact-box-link">{cb.val}</a>
                                ) : (
                                  <span>{cb.val}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="policy-sidebar-col">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="sidebar-sticky">
              {/* MSME Govt Badge Card */}
              <div className="glass-panel msme-sidebar-badge text-center">
                <div className="msme-badge-header">
                  <img src="/msme_logo.png" alt="Govt MSME Logo" className="sidebar-msme-img" />
                  <div>
                    <h3>Govt. MSME Registered</h3>
                    <span className="msme-reg-sub">Ministry of MSME, Govt. of India</span>
                  </div>
                </div>
                <p className="msme-badge-desc">
                  InternDock is an officially registered enterprise under the Govt. of India Ministry of MSME (Gorakhpur U.P. India).
                </p>
              </div>

              {/* Direct Line Support */}
              <div className="glass-panel help-sidebar-card" style={{ marginTop: "1.5rem" }}>
                <div className="help-icon-wrapper" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                  <Phone size={22} color="#ef4444" />
                </div>
                <h3>Direct Line Support</h3>
                <p>Have UTR reference verification questions or payment submission issues?</p>
                <div className="help-contact-stack">
                  <a href="tel:+918808307121" className="contact-link-row">
                    <Phone size={16} />
                    <span>+91 8808307121</span>
                  </a>
                  <a href="mailto:support@interndock.in" className="contact-link-row">
                    <Mail size={16} />
                    <span>support@interndock.in</span>
                  </a>
                </div>
                <a href="tel:+918808307121" className="btn btn-primary btn-glow full-width" style={{ marginTop: "1rem" }}>
                  <span>Call Direct Support</span>
                  <ChevronRight size={16} />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        .policy-redesign-wrapper {
          position: relative;
          min-height: 100vh;
          padding: 3.5rem 0 5rem 0;
          overflow: hidden;
        }
        .policy-ambient-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .policy-container {
          position: relative;
          z-index: 1;
          max-width: 1140px;
        }
        .policy-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-weight: 700;
          font-size: 0.92rem;
          margin-bottom: 1.5rem;
          text-decoration: none;
          transition: color 0.2s;
        }
        .policy-back-btn:hover {
          color: var(--primary);
        }
        .policy-hero-banner {
          padding: 2.75rem;
          margin-bottom: 2rem;
          border-left: 5px solid var(--accent-red);
        }
        .hero-top-badges {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }
        .policy-hero-heading {
          font-size: 2.5rem;
          font-weight: 900;
          line-height: 1.2;
          margin-bottom: 0.75rem;
        }
        .policy-hero-sub {
          color: var(--text-muted);
          font-size: 1.05rem;
          line-height: 1.6;
          max-width: 860px;
          margin-bottom: 1.5rem;
        }
        .policy-meta-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          font-size: 0.85rem;
          color: var(--text-subtle);
          font-weight: 600;
          flex-wrap: wrap;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        .meta-divider {
          color: var(--border-color);
        }
        .policy-tab-nav {
          display: flex;
          gap: 0.65rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          margin-bottom: 2rem;
        }
        .policy-nav-tab {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.6rem 1.1rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .policy-nav-tab:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .policy-nav-tab.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .policy-layout-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2rem;
        }
        .policy-sections-col {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }
        .policy-card-block {
          padding: 2.25rem;
          transition: transform 0.2s;
        }
        .card-top-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .icon-badge-box {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .card-tag {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .card-title {
          font-size: 1.35rem;
          font-weight: 900;
          margin: 0;
          color: var(--text-main);
        }
        .card-summary {
          color: var(--text-muted);
          font-size: 0.98rem;
          line-height: 1.6;
          margin-bottom: 1.25rem;
        }
        .policy-bullet-stack {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .bullet-row-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.93rem;
          line-height: 1.55;
          color: var(--text-muted);
          background: rgba(248, 250, 252, 0.7);
          padding: 0.85rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }
        .bullet-icon {
          color: var(--accent-emerald);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .contact-boxes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        .contact-box-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .contact-box-item strong {
          display: block;
          font-size: 0.8rem;
          color: var(--text-subtle);
          text-transform: uppercase;
        }
        .contact-box-link {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
        }
        .sidebar-sticky {
          position: sticky;
          top: 90px;
        }
        .msme-sidebar-badge {
          padding: 1.75rem;
          border-top: 4px solid #c9962f;
        }
        .msme-badge-header {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-bottom: 1rem;
          text-align: left;
        }
        .sidebar-msme-img {
          width: 52px;
          height: 52px;
          object-fit: contain;
          border-radius: 50%;
          border: 2px solid #c9962f;
          padding: 2px;
          background: #ffffff;
        }
        .msme-badge-header h3 {
          font-size: 1.05rem;
          font-weight: 900;
          margin: 0;
          color: var(--text-main);
        }
        .msme-reg-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .msme-badge-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin: 0;
          text-align: left;
        }
        .help-sidebar-card {
          padding: 1.75rem;
        }
        .help-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .help-sidebar-card h3 {
          font-size: 1.15rem;
          font-weight: 900;
          margin-bottom: 0.4rem;
        }
        .help-sidebar-card p {
          font-size: 0.88rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }
        @media (max-width: 900px) {
          .policy-layout-grid {
            grid-template-columns: 1fr;
          }
          .sidebar-sticky {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}
