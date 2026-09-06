import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Award,
  CheckCircle2,
  ShieldCheck,
  Code,
  Globe,
  Sparkles,
  ChevronRight,
  FileText,
} from "lucide-react";

export default function TermsOfService() {
  const [activeTab, setActiveTab] = useState("all");

  const sections = [
    {
      id: "program",
      icon: BookOpen,
      iconColor: "#4f46e5",
      badge: "Program Scope",
      title: "1. Nature of Internship Program",
      summary:
        "InternDock provides project-based learning internships engineered for practical software development, capstone creation, and mentor evaluations:",
      bullets: [
        {
          label: "Learning-Centric Model:",
          detail:
            "Programs are designed for academic upskilling, GitHub portfolio development, and engineering mastery.",
        },
        {
          label: "Track Durations:",
          detail:
            "Flexible self-paced program options spanning 4 Weeks, 6 Weeks, 8 Weeks, 12 Weeks, or 24 Weeks.",
        },
        {
          label: "Educational Governance:",
          detail:
            "Enrollment is an educational upskilling track and does not constitute a guaranteed employment contract.",
        },
      ],
    },
    {
      id: "credentials",
      icon: Award,
      iconColor: "#10b981",
      badge: "Document Issuance",
      title: "2. Selection Letter & Certificate Governance",
      summary:
        "Official documents are issued under strict evaluation and verification rules:",
      bullets: [
        {
          label: "Immediate Offer Letter Unlocking:",
          detail:
            "Upon selection, candidates immediately receive an official PDF Offer Selection Letter signed by Founder & CEO Aman Mishra.",
        },
        {
          label: "Weekly Capstone Milestones:",
          detail:
            "Students complete weekly guided assignments submitted directly via their Student Workspace.",
        },
        {
          label: "Cryptographic Completion Certificate:",
          detail:
            "Awarded upon successfully completing assigned weekly milestones and capstone project submissions.",
        },
      ],
    },
    {
      id: "ethics",
      icon: Code,
      iconColor: "#d97706",
      badge: "Academic Integrity",
      title: "3. Code of Ethics & Anti-Plagiarism",
      summary:
        "We uphold rigorous software engineering standards across all submitted repositories:",
      bullets: [
        {
          label: "Original Code Requirement:",
          detail:
            "Submissions must be original or properly attributed open-source work. Fraudulent work voids certificate eligibility.",
        },
        {
          label: "Professional Conduct:",
          detail:
            "Respectful collaboration is mandatory across mentor reviews and student workspace channels.",
        },
      ],
    },
    {
      id: "verification",
      icon: ShieldCheck,
      iconColor: "#0284c7",
      badge: "Public Ledger",
      title: "4. Intellectual Property & Credential Verification",
      summary:
        "Candidates retain 100% ownership over their created software projects and capstones:",
      bullets: [
        {
          label: "Candidate IP Ownership:",
          detail:
            "You own all code repositories, projects, and apps built during your internship track.",
        },
        {
          label: "Public Ledger Verification:",
          detail:
            "InternDock maintains permanent public verification endpoints (/verify/offer/:id and /verify/certificate/:id) for recruiter background checks.",
        },
      ],
    },
  ];

  const filteredSections =
    activeTab === "all" ? sections : sections.filter((s) => s.id === activeTab);

  return (
    <div className="policy-redesign-wrapper">
      <div className="policy-ambient-bg" aria-hidden="true" />

      <div className="container policy-container">
        {/* Top Link */}
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
          style={{ borderLeftColor: "#4f46e5" }}
        >
          <div className="hero-top-badges">
            <span className="badge-pill badge-pill-cyan">
              <BookOpen size={14} />
              <span>Official Governance Terms</span>
            </span>
            <span className="badge-pill badge-pill-amber">
              <Sparkles size={14} />
              <span>Govt. MSME Registered Enterprise</span>
            </span>
          </div>

          <h1 className="policy-hero-heading">
            Terms of Service &amp; <br />
            <span className="gradient-text">Internship Guidelines</span>
          </h1>

          <p className="policy-hero-sub">
            Please review the official rules, project submission guidelines,
            selection letter terms, and completion certificate issuance policies
            governing your enrollment at <strong>InternDock</strong>.
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
              <strong>Governance:</strong> Academic Honor Code
            </div>
          </div>
        </motion.div>

        {/* Interactive Filter Nav */}
        <div className="policy-tab-nav">
          <button
            className={`policy-nav-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <span>Overview &amp; All Rules</span>
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
                  All internship tracks, offer letters, and credentials issued
                  by InternDock comply with Govt. MSME enterprise standards
                  (Gorakhpur U.P. India).
                </p>
              </div>

              {/* Legal Desk */}
              <div
                className="glass-panel help-sidebar-card"
                style={{ marginTop: "1.5rem" }}
              >
                <div className="help-icon-wrapper">
                  <FileText size={22} color="#4f46e5" />
                </div>
                <h3>Legal &amp; Accreditation</h3>
                <p>
                  Need custom university cohort onboarding or official
                  verification clearance?
                </p>
                <a
                  href="mailto:support@interndock.in"
                  className="btn btn-primary btn-glow full-width"
                  style={{ marginTop: "1rem" }}
                >
                  <span>Email Legal Desk</span>
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
                      radial-gradient(circle at 90% 80%, rgba(2, 132, 199, 0.06), transparent 40%);
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
          border-left: 5px solid var(--primary);
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
          background: rgba(79, 70, 229, 0.1);
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
          .card-summary, .bullet-row-item { overflow-wrap: anywhere; }
          .bullet-row-item { padding: 0.75rem; font-size: 0.87rem; }
          .msme-sidebar-badge, .help-sidebar-card { padding: 1.25rem; }
        }
      `}</style>
    </div>
  );
}
