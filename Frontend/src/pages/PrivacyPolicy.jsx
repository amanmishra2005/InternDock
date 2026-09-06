import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Eye,
  Server,
  FileText,
  Mail,
  Globe,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Award,
} from "lucide-react";

export default function PrivacyPolicy() {
  const [activeTab, setActiveTab] = useState("all");

  const sections = [
    {
      id: "collection",
      icon: Eye,
      iconColor: "#4f46e5",
      badge: "Data Ingestion",
      title: "1. Information We Collect",
      summary:
        "When you register for an internship track or submit capstones on InternDock, we collect essential candidate information to administer your track:",
      bullets: [
        {
          label: "Candidate Identity & Contact:",
          detail:
            "Legal Name, Email Address, Contact Number, Academic Institution, Degree Track, and Graduation Batch.",
        },
        {
          label: "Internship Activity & Capstones:",
          detail:
            "Enrolled Domain Track, Duration (4 to 24 Weeks), Weekly GitHub Project Links, and Mentor Ratings.",
        },
        {
          label: "Cryptographic Credentials:",
          detail:
            "Unique Verification IDs, Digital Hashes, Reference Numbers, and Issuance Ledger Records.",
        },
        {
          label: "Technical Session Logs:",
          detail:
            "IP Addresses, Device Fingerprints, Encrypted JWT Auth Tokens, and Security Audits.",
        },
      ],
    },
    {
      id: "processing",
      icon: Server,
      iconColor: "#0284c7",
      badge: "Data Utilization",
      title: "2. How We Process Candidate Data",
      summary:
        "Your data is strictly processed to fulfill academic, credentialing, and career verification services:",
      cards: [
        {
          icon: FileText,
          title: "Offer Letter & Certificate Issuance",
          text: "Generating cryptographically verifiable PDF Offer Letters & Completion Certificates signed by Founder & CEO Aman Mishra.",
        },
        {
          icon: ShieldCheck,
          title: "Employer & Recruiter Verification",
          text: "Allowing university partners and hiring managers to instantly authenticate credentials via /verify/certificate/:id.",
        },
        {
          icon: Globe,
          title: "Capstone & Code Evaluation",
          text: "Assessing weekly GitHub repositories, running code lint checks, and delivering detailed mentor feedback.",
        },
      ],
    },
    {
      id: "security",
      icon: Lock,
      iconColor: "#10b981",
      badge: "Security & Zero-Sale",
      title: "3. Data Security & Zero-Sale Guarantee",
      summary:
        "InternDock implements strict enterprise-grade security protocols to protect candidate records:",
      bullets: [
        {
          label: "AES-256 / TLS 1.3 Encryption:",
          detail:
            "All data payloads in transit and at rest are secured with bank-grade encryption protocols.",
        },
        {
          label: "Zero-Sale Guarantee:",
          detail:
            "We NEVER sell, rent, or trade student personal data to third-party advertisers or data brokers.",
        },
        {
          label: "Immutable Ledger Storage:",
          detail:
            "Verification hashes are stored permanently to prevent academic document tampering or forgery.",
        },
      ],
    },
    {
      id: "rights",
      icon: Award,
      iconColor: "#8b5cf6",
      badge: "Student Rights",
      title: "4. Candidate Rights & Data Control",
      summary:
        "Students retain full transparency over their candidate records and public credentials:",
      bullets: [
        {
          label: "Permanent Verifiability:",
          detail:
            "Issued Selection Letters and Certificates remain permanently active on www.interndock.in for background checks.",
        },
        {
          label: "Profile Correction Requests:",
          detail:
            "Request name or institution corrections prior to certificate issuance via support desk.",
        },
      ],
    },
  ];

  const filteredSections =
    activeTab === "all" ? sections : sections.filter((s) => s.id === activeTab);

  return (
    <div className="policy-redesign-wrapper">
      {/* Background ambient glow mesh */}
      <div className="policy-ambient-bg" aria-hidden="true" />

      <div className="container policy-container">
        {/* Top Breadcrumb Link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
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
        >
          <div className="hero-top-badges">
            <span className="badge-pill badge-pill-emerald">
              <ShieldCheck size={14} />
              <span>Official Privacy Protocol</span>
            </span>
            <span className="badge-pill badge-pill-amber">
              <Sparkles size={14} />
              <span>Govt. MSME Registered Enterprise</span>
            </span>
          </div>

          <h1 className="policy-hero-heading">
            Candidate Privacy &amp; <br />
            <span className="gradient-text">Data Protection Policy</span>
          </h1>

          <p className="policy-hero-sub">
            InternDock ("InternDock", "we", "us") is dedicated to upholding
            candidate privacy, data security, and cryptographic credential
            integrity across all technology internship tracks.
          </p>

          <div className="policy-meta-row">
            <div className="meta-item">
              <strong>Last Revised:</strong> September 04, 2026
            </div>
            <div className="meta-divider">•</div>
            <div className="meta-item">
              <strong>Compliance:</strong> DPDP Act &amp; MSME Standard
            </div>
            <div className="meta-divider">•</div>
            <div className="meta-item">
              <strong>Domain:</strong> www.interndock.in
            </div>
          </div>
        </motion.div>

        {/* Interactive Filter Nav */}
        <div className="policy-tab-nav">
          <button
            className={`policy-nav-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <span>Overview &amp; All Sections</span>
          </button>
          {sections.map((s) => (
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

        {/* Main Grid: Policy Content + Sidebar */}
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
                      <div
                        className="icon-badge-box"
                        style={{
                          background: `${sec.iconColor}15`,
                          border: `1px solid ${sec.iconColor}30`,
                        }}
                      >
                        <IconComponent
                          size={22}
                          style={{ color: sec.iconColor }}
                        />
                      </div>
                      <div>
                        <span
                          className="card-tag"
                          style={{ color: sec.iconColor }}
                        >
                          {sec.badge}
                        </span>
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

                    {sec.cards && (
                      <div className="usage-grid">
                        {sec.cards.map((c, i) => {
                          const CIcon = c.icon;
                          return (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              key={i}
                              className="usage-subcard"
                            >
                              <CIcon size={20} color="#4f46e5" />
                              <h4>{c.title}</h4>
                              <p>{c.text}</p>
                            </motion.div>
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
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sidebar-sticky"
            >
              {/* MSME Govt Badge Card */}
              <div className="glass-panel msme-sidebar-badge text-center">
                <div className="msme-badge-header">
                  <img
                    src="/msme_logo.png"
                    alt="Govt MSME Logo"
                    className="sidebar-msme-img"
                  />
                  <div>
                    <h3>Govt. MSME Registered</h3>
                    <span className="msme-reg-sub">
                      Ministry of MSME, Govt. of India
                    </span>
                  </div>
                </div>
                <p className="msme-badge-desc">
                  InternDock operates as an officially recognized technical
                  enterprise under the Ministry of Micro, Small &amp; Medium
                  Enterprises (Gorakhpur U.P. India).
                </p>
              </div>

              {/* Data Protection Desk Widget */}
              <div
                className="glass-panel help-sidebar-card"
                style={{ marginTop: "1.5rem" }}
              >
                <div className="help-icon-wrapper">
                  <Mail size={22} color="#10b981" />
                </div>
                <h3>Privacy Desk &amp; Support</h3>
                <p>
                  Have questions regarding candidate data protection or
                  credential verification?
                </p>
                <div className="help-contact-stack">
                  <a
                    href="mailto:support@interndock.in"
                    className="contact-link-row"
                  >
                    <Mail size={16} />
                    <span>support@interndock.in</span>
                  </a>
                  <a
                    href="https://www.interndock.in"
                    target="_blank"
                    rel="noreferrer"
                    className="contact-link-row"
                  >
                    <Globe size={16} />
                    <span>www.interndock.in</span>
                  </a>
                </div>
                <a
                  href="mailto:support@interndock.in"
                  className="btn btn-primary btn-glow full-width"
                  style={{ marginTop: "1rem" }}
                >
                  <span>Contact Privacy Team</span>
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
          background: radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.06), transparent 40%),
                      radial-gradient(circle at 90% 80%, rgba(13, 148, 136, 0.06), transparent 40%);
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
          border-left: 5px solid var(--accent-emerald);
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
        .usage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        .usage-subcard {
          padding: 1.25rem;
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
        }
        .usage-subcard h4 {
          font-size: 0.95rem;
          font-weight: 800;
          margin: 0.6rem 0 0.35rem 0;
          color: var(--text-main);
        }
        .usage-subcard p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.45;
          margin: 0;
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
          background: rgba(16, 185, 129, 0.1);
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
        .help-contact-stack {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .contact-link-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
        }
        @media (max-width: 900px) {
          .policy-layout-grid {
            grid-template-columns: 1fr;
          }
          .sidebar-sticky {
            position: static;
          }
        }
        @media (max-width: 640px) {
          .policy-redesign-wrapper { padding: 2rem 0 3rem; }
          .policy-hero-banner { padding: 1.5rem; border-left-width: 3px; }
          .policy-hero-heading { font-size: clamp(1.8rem, 9vw, 2.35rem); }
          .policy-hero-sub { font-size: 0.92rem; }
          .policy-meta-row { align-items: flex-start; flex-direction: column; gap: 0.35rem; }
          .meta-divider { display: none; }
          .policy-card-block { padding: 1.25rem; }
          .card-top-header { align-items: flex-start; gap: 0.7rem; }
          .card-title { font-size: 1.1rem; overflow-wrap: anywhere; }
          .card-summary, .bullet-row-item, .usage-subcard p { overflow-wrap: anywhere; }
          .bullet-row-item { padding: 0.75rem; font-size: 0.87rem; }
          .msme-sidebar-badge, .help-sidebar-card { padding: 1.25rem; }
        }
      `}</style>
    </div>
  );
}
