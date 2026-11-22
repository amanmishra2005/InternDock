import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Award, FileText,
  Briefcase, Check, CalendarDays, GraduationCap, Clock,
  ShieldCheck, Zap, Star, Users, BookOpen, Lock, Sparkles,
  Trophy, Target, Rocket, Code2, Layers, GitBranch, MessageSquare
} from "lucide-react";
import api from "../api/axios";

function getTodayInputValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(val, days) {
  const d = new Date(`${val}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function displayDate(str) {
  if (!str) return "—";
  try {
    return new Date(`${str}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return str; }
}

const INCLUSIONS = [
  { icon: <FileText size={20} color="#4f46e5" />, bg: "#eff0ff", border: "#c7d2fe", title: "Instant Offer Letter", desc: "Official PDF with QR verification, issued immediately on approval." },
  { icon: <Award size={20} color="#7c3aed" />, bg: "#f3e8ff", border: "#ddd6fe", title: "Verified Certificate", desc: "Cryptographically signed certificate with QR code for recruiter verification." },
  { icon: <BookOpen size={20} color="#0284c7" />, bg: "#e0f2fe", border: "#bae6fd", title: "Weekly Capstones", desc: "Practical project milestones with industry-standard engineering briefs." },
  { icon: <MessageSquare size={20} color="#059669" />, bg: "#ecfdf5", border: "#a7f3d0", title: "Mentor Feedback", desc: "Personal code reviews and guidance from senior engineers every week." },
  { icon: <Users size={20} color="#d97706" />, bg: "#fffbeb", border: "#fde68a", title: "Intern Community", desc: "Exclusive WhatsApp hub with selected interns, resources & updates." },
  { icon: <GitBranch size={20} color="#0284c7" />, bg: "#e0f2fe", border: "#bae6fd", title: "GitHub Portfolio", desc: "Real production-grade capstone for your developer portfolio." },
  { icon: <Layers size={20} color="#7c3aed" />, bg: "#f3e8ff", border: "#ddd6fe", title: "Shareable PDF", desc: "Downloadable credential with your name, college & internship details." },
  { icon: <Lock size={20} color="#64748b" />, bg: "#f8fafc", border: "#e2e8f0", title: "256-bit SSL", desc: "All transactions and credentials secured with enterprise encryption." },
];

const CURRICULUM = [
  { week: "Week 1", phase: "Foundation", color: "#4f46e5", bg: "#eff0ff", title: "Setup & System Architecture", desc: "Configure dev environment, starter repositories, git workflows, and project planning." },
  { week: "Week 2", phase: "Core Skills", color: "#0284c7", bg: "#e0f2fe", title: "Core Domain Foundations", desc: "Implement core algorithms, data structures, API endpoints, or domain-specific UI components." },
  { week: "Week 3", phase: "Build", color: "#059669", bg: "#ecfdf5", title: "Applied Feature Mini-Project", desc: "Build a multi-component production feature module with integration tests." },
  { week: "Week 4+", phase: "Capstone", color: "#7c3aed", bg: "#f3e8ff", title: "Capstone & Credential Unlocking", desc: "Deploy capstone project, submit GitHub repo, and receive your verified certificate." },
];

export default function DomainDetails() {
  const { slug } = useParams();
  const [domain, setDomain] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [startDate, setStartDate] = useState(getTodayInputValue());
  const [endDate, setEndDate] = useState("");
  const [college, setCollege] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();

  useEffect(() => {
    const saved = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
    if (saved.college) setCollege(saved.college);
    api.get(`/domains/${slug}`)
      .then(res => {
        setDomain(res.data);
        if (res.data.availableDurations?.length) setSelectedId(res.data.availableDurations[0]._id);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [slug]);

  const activeDur = domain?.availableDurations?.find(d => d._id === selectedId) || domain?.availableDurations?.[0];

  useEffect(() => {
    if (startDate && activeDur?.weeks) setEndDate(addDays(startDate, activeDur.weeks * 7 - 1));
  }, [startDate, activeDur?.weeks]);

  const handleApply = () => {
    if (!user) return navigate("/login", { state: { from: `/domains/${slug}` } });
    const q = selectedId ? `?durationId=${selectedId}` : "";
    navigate(`/apply/${domain.slug}${q}`);
  };

  if (loading) return (
    <div className="container text-center" style={{ padding: "6rem 1rem" }}>
      <div className="spinner" />
      <p style={{ marginTop: "1rem", color: "#64748b" }}>Loading internship details...</p>
    </div>
  );

  if (!domain) return (
    <div className="container text-center" style={{ padding: "6rem 1rem" }}>
      <h2>Domain Not Found</h2>
      <Link to="/domains"><motion.button whileHover={{ scale: 1.05 }} className="btn btn-primary" style={{ marginTop: "1rem" }}><ArrowLeft size={16} /><span>Back to Domains</span></motion.button></Link>
    </div>
  );

  const totalDays = activeDur ? activeDur.weeks * 7 : 0;

  return (
    <div className="dd-wrap">

      {/* ══ HERO ══ */}
      <div className="dd-hero-band">
        <div className="dd-hero-glow dd-hero-glow-1" />
        <div className="dd-hero-glow dd-hero-glow-2" />
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <Link to="/domains" className="dd-back-link">
            <ArrowLeft size={14} /> All Internship Domains
          </Link>

          <div className="dd-hero-content">
            <div className="dd-hero-left">
              <div className="dd-hero-tags">
                <span className="dh-tag dh-tag-cat">{domain.category}</span>
                <span className="dh-tag dh-tag-green"><CheckCircle2 size={12} /> Verified Capstone Track</span>
                <span className="dh-tag dh-tag-amber"><Sparkles size={11} /> Winter 2026–27</span>
              </div>

              <h1 className="dd-h1">{domain.name}</h1>
              <p className="dd-hero-desc">{domain.description}</p>

              <div className="dd-skill-row">
                <span className="dd-skill-label">Skills you'll master:</span>
                <div className="dd-skill-chips">
                  {domain.skills?.map(s => (
                    <span key={s} className="dd-skill-chip"><Check size={11} /> {s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Hero Stat Pills */}
            <div className="dd-hero-kpis">
              <div className="dd-kpi">
                <Clock size={18} color="#818cf8" />
                <div>
                  <div className="dd-kpi-val">4–24 Weeks</div>
                  <div className="dd-kpi-label">Self-Paced Program</div>
                </div>
              </div>
              <div className="dd-kpi">
                <ShieldCheck size={18} color="#34d399" />
                <div>
                  <div className="dd-kpi-val">Instant</div>
                  <div className="dd-kpi-label">Offer Letter Issued</div>
                </div>
              </div>
              <div className="dd-kpi">
                <Award size={18} color="#c084fc" />
                <div>
                  <div className="dd-kpi-val">QR Verified</div>
                  <div className="dd-kpi-label">Completion Certificate</div>
                </div>
              </div>
              <div className="dd-kpi">
                <Star size={18} color="#fbbf24" />
                <div>
                  <div className="dd-kpi-val">Starting ₹{domain.availableDurations?.[0]?.fee ?? "100"}</div>
                  <div className="dd-kpi-label">All Inclusive Fee</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="container dd-body">
        <div className="dd-grid">

          {/* ── LEFT COLUMN ── */}
          <div className="dd-left">

            {/* About the program */}
            <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="dd-section">
              <div className="dd-section-label"><Target size={15} color="#4f46e5" /> About This Internship</div>
              <div className="dd-about-grid">
                <div className="dd-about-item">
                  <div className="dd-about-icon" style={{ background: "#eff0ff" }}><Code2 size={18} color="#4f46e5" /></div>
                  <div>
                    <div className="dd-about-title">Real-World Projects</div>
                    <div className="dd-about-desc">Work on production-grade capstone projects used by real teams.</div>
                  </div>
                </div>
                <div className="dd-about-item">
                  <div className="dd-about-icon" style={{ background: "#ecfdf5" }}><Rocket size={18} color="#059669" /></div>
                  <div>
                    <div className="dd-about-title">Self-Paced & Flexible</div>
                    <div className="dd-about-desc">Submit milestones on your schedule within your selected window.</div>
                  </div>
                </div>
                <div className="dd-about-item">
                  <div className="dd-about-icon" style={{ background: "#f3e8ff" }}><Trophy size={18} color="#7c3aed" /></div>
                  <div>
                    <div className="dd-about-title">Official Credentials</div>
                    <div className="dd-about-desc">Recruiter-verified offer letter & certificate with QR authentication.</div>
                  </div>
                </div>
                <div className="dd-about-item">
                  <div className="dd-about-icon" style={{ background: "#fffbeb" }}><Users size={18} color="#d97706" /></div>
                  <div>
                    <div className="dd-about-title">Mentor-Led Reviews</div>
                    <div className="dd-about-desc">Senior engineers review your code and give structured feedback.</div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Curriculum timeline */}
            <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="dd-section">
              <div className="dd-section-label"><BookOpen size={15} color="#4f46e5" /> Program Curriculum</div>
              <div className="dd-curriculum">
                {CURRICULUM.map((item, i) => (
                  <div key={i} className="dd-cur-row">
                    <div className="dd-cur-left">
                      <div className="dd-cur-dot" style={{ background: item.color }} />
                      {i < CURRICULUM.length - 1 && <div className="dd-cur-line" />}
                    </div>
                    <div className="dd-cur-body">
                      <div className="dd-cur-week-row">
                        <span className="dd-cur-week" style={{ background: item.bg, color: item.color, border: `1px solid ${item.color}33` }}>{item.week}</span>
                        <span className="dd-cur-phase" style={{ color: item.color }}>{item.phase}</span>
                      </div>
                      <div className="dd-cur-title">{item.title}</div>
                      <div className="dd-cur-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* What's included */}
            <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="dd-section">
              <div className="dd-section-label"><ShieldCheck size={15} color="#059669" /> What's Included</div>
              <div className="dd-inc-grid">
                {INCLUSIONS.map((item, i) => (
                  <motion.div key={i} whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(15,23,42,0.09)" }} className="dd-inc-card">
                    <div className="dd-inc-icon" style={{ background: item.bg, border: `1px solid ${item.border}` }}>{item.icon}</div>
                    <div className="dd-inc-title">{item.title}</div>
                    <div className="dd-inc-desc">{item.desc}</div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* ── Application Config ── */}
            <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="dd-section dd-config-section">
              <div className="dd-config-header">
                <Zap size={18} color="#4f46e5" />
                <div>
                  <div className="dd-config-title">Configure Your Application</div>
                  <div className="dd-config-sub">Choose your track, dates, and college — your summary updates live on the right.</div>
                </div>
              </div>

              {/* Step 1 — Duration */}
              <div className="dd-step">
                <div className="dd-step-head">
                  <div className="dd-step-num">1</div>
                  <div>
                    <div className="dd-step-title">Select Duration Track</div>
                    <div className="dd-step-sub">All tracks are self-paced with weekly milestones. Mentor code reviews included.</div>
                  </div>
                </div>
                <div className="dd-dur-grid">
                  {domain.availableDurations?.map((dur) => {
                    const sel = dur._id === (selectedId || domain.availableDurations[0]?._id);
                    return (
                      <motion.button key={dur._id} type="button"
                        whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedId(dur._id)}
                        className={`dd-dur-btn ${sel ? "dd-dur-sel" : ""}`}>
                        <div className="dd-dur-top">
                          <div className="dd-dur-left-info">
                            <div className={`dd-dur-radio ${sel ? "sel" : ""}`}>{sel && <span />}</div>
                            <div>
                              <div className="dd-dur-name">{dur.label || `${dur.weeks} Weeks`} Track</div>
                              <div className="dd-dur-meta">{dur.weeks} weeks · {dur.weeks * 7} days self-paced</div>
                            </div>
                          </div>
                          <div className={`dd-dur-price ${sel ? "sel" : ""}`}>₹{dur.fee}</div>
                        </div>
                        <div className="dd-dur-feats">
                          <span><Check size={10} color="#059669" /> Weekly capstones</span>
                          <span><Check size={10} color="#059669" /> Code review</span>
                          <span><Check size={10} color="#059669" /> Offer letter</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2 — Dates */}
              <div className="dd-step">
                <div className="dd-step-head">
                  <div className="dd-step-num">2</div>
                  <div>
                    <div className="dd-step-title">Internship Schedule & Dates</div>
                    <div className="dd-step-sub">Select when your internship starts. The end date is automatically calculated for you.</div>
                  </div>
                </div>
                <div className="dd-dates-row">
                  <div className="dd-date-field">
                    <label className="dd-label"><CalendarDays size={13} color="#4f46e5" /> Starting Date</label>
                    <input type="date" className="dd-input" value={startDate} min={getTodayInputValue()}
                      onChange={e => setStartDate(e.target.value)} />
                    <span className="dd-hint">Select your preferred start day</span>
                  </div>
                  <div className="dd-date-sep">→</div>
                  <div className="dd-date-field">
                    <label className="dd-label"><CalendarDays size={13} color="#0284c7" /> Estimated Completion Date</label>
                    <input type="date" className="dd-input dd-input-auto" value={endDate} readOnly />
                    <span className="dd-hint">Calculated from your {activeDur?.weeks || 4}-week track</span>
                  </div>
                </div>
                <div className="dd-notice-amber">
                  <Zap size={14} color="#d97706" />
                  <span><strong>Flexible & Self-Paced:</strong> You can submit your milestone capstones ahead of schedule or at your own pace within the designated window.</span>
                </div>
              </div>

              {/* Step 3 — College */}
              <div className="dd-step">
                <div className="dd-step-head">
                  <div className="dd-step-num">3</div>
                  <div>
                    <div className="dd-step-title">Academic & Student Information</div>
                    <div className="dd-step-sub">Confirm your details to be inscribed on your verified credentials.</div>
                  </div>
                </div>
                <div className="dd-student-info">
                  {user && (
                    <div className="dd-student-prefilled">
                      <div className="dd-prefilled-field">
                        <div className="dd-pf-icon"><ShieldCheck size={12} color="#059669" /></div>
                        <div>
                          <div className="dd-pf-label">Candidate Name <span className="dd-verified">Verified ✓</span></div>
                          <div className="dd-pf-val">{user.name}</div>
                        </div>
                      </div>
                      <div className="dd-prefilled-field">
                        <div className="dd-pf-icon"><ShieldCheck size={12} color="#059669" /></div>
                        <div>
                          <div className="dd-pf-label">Verified Email <span className="dd-verified">Verified ✓</span></div>
                          <div className="dd-pf-val">{user.email}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="dd-college-field">
                    <label className="dd-label"><GraduationCap size={13} color="#4f46e5" /> College / University / Institution Name</label>
                    <input type="text" className="dd-input"
                      placeholder="e.g. Delhi Technological University / IIT Bombay / Amity / SRM"
                      value={college} onChange={e => setCollege(e.target.value)} />
                    <span className="dd-hint"><ShieldCheck size={11} color="#059669" style={{ display:"inline", marginRight:"4px", verticalAlign:"middle" }} />Printed on your official Offer Letter and cryptographically verified Completion Certificate.</span>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>

          {/* ── RIGHT — STICKY SIDEBAR ── */}
          <div className="dd-right">
            <div className="dd-sticky-panel">

              {/* Application Card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="dd-app-card">
                <div className="dd-app-card-top">
                  <div className="dd-oc-seal"><Award size={14} color="#818cf8" /> Official Selection Record</div>
                  <div className="dd-instant-pill"><span className="dd-pulse" /> Instant Approval</div>
                </div>

                <div className="dd-app-domain">
                  <div className="dd-app-cat">{domain.category}</div>
                  <div className="dd-app-name">{domain.name}</div>
                  <div className="dd-app-track"><Clock size={12} /> {activeDur?.label || `${activeDur?.weeks} Weeks`} Track</div>
                </div>

                <div className="dd-app-breakdown">
                  <div className="dd-ab-row"><span>Start Date</span><strong>{displayDate(startDate)}</strong></div>
                  <div className="dd-ab-row"><span>End Date</span><strong>{displayDate(endDate)}</strong></div>
                  <div className="dd-ab-row"><span>Track Duration</span><strong>{activeDur?.weeks} Weeks ({totalDays} Days)</strong></div>
                  {college && <div className="dd-ab-row dd-ab-college"><span>Institution</span><strong>{college}</strong></div>}
                  <div className="dd-ab-divider" />
                  <div className="dd-ab-fee-row">
                    <div>
                      <div className="dd-fee-label">Total Program Fee</div>
                      <div className="dd-fee-note">All inclusive · No hidden charges</div>
                    </div>
                    <div className="dd-fee-amount">₹{activeDur?.fee ?? 0}</div>
                  </div>
                </div>

                <div className="dd-cred-list">
                  <div className="dd-cred-title">Official Inclusions:</div>
                  {[
                    "Instant Verified Offer Letter (PDF + Verification URL)",
                    "Cryptographically Verified Certificate with QR validation",
                    "Weekly Practical Capstone Project Milestones",
                    "Mentor Code Reviews & Feedback",
                    "Official Selected Interns WhatsApp Community Hub",
                  ].map((it, i) => (
                    <div key={i} className="dd-cred-row"><CheckCircle2 size={13} color="#34d399" /><span>{it}</span></div>
                  ))}
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleApply} className="dd-cta-btn">
                  {user ? `Confirm & Generate Selection Letter (₹${activeDur?.fee ?? 0})` : "Sign In to Apply"}
                  <ArrowRight size={17} />
                </motion.button>

                <div className="dd-trust">
                  <span><Lock size={10} /> 256-Bit SSL Encrypted</span>
                  <span><ShieldCheck size={10} /> Recruiter Verifiable</span>
                </div>
              </motion.div>

              {/* Need help box */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="dd-help-box">
                <div className="dd-help-title"><MessageSquare size={14} color="#4f46e5" /> Have questions?</div>
                <div className="dd-help-text">Reach us on WhatsApp or email at <strong>connect@interndock.in</strong> — we typically reply within 2 hours.</div>
              </motion.div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        /* ═══ Wrapper ═══ */
        .dd-wrap { background: #f1f5f9; min-height: 100vh; padding-bottom: 5rem; }

        /* ═══ Hero Band ═══ */
        .dd-hero-band {
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          padding: 2.5rem 0 3rem; position: relative; overflow: hidden;
        }
        .dd-hero-glow {
          position: absolute; border-radius: 50%; pointer-events: none;
        }
        .dd-hero-glow-1 {
          width: 600px; height: 600px; top: -200px; right: -100px;
          background: radial-gradient(circle, rgba(79,70,229,0.35) 0%, transparent 65%);
        }
        .dd-hero-glow-2 {
          width: 400px; height: 400px; bottom: -150px; left: -50px;
          background: radial-gradient(circle, rgba(2,132,199,0.25) 0%, transparent 65%);
        }
        .dd-back-link {
          display: inline-flex; align-items: center; gap: 0.4rem;
          color: rgba(255,255,255,0.5); font-size: 0.82rem; font-weight: 600;
          text-decoration: none; margin-bottom: 1.5rem; transition: color 0.2s;
        }
        .dd-back-link:hover { color: rgba(255,255,255,0.85); }

        .dd-hero-content { display: flex; align-items: flex-start; gap: 3rem; }
        .dd-hero-left { flex: 1; }

        .dd-hero-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .dh-tag {
          display: inline-flex; align-items: center; gap: 0.3rem;
          font-size: 0.72rem; font-weight: 700; padding: 0.28rem 0.75rem;
          border-radius: 100px; letter-spacing: 0.03em;
        }
        .dh-tag-cat { background: rgba(129,140,248,0.2); color: #a5b4fc; border: 1px solid rgba(129,140,248,0.3); }
        .dh-tag-green { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
        .dh-tag-amber { background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); }

        .dd-h1 {
          font-size: clamp(2rem, 4vw, 3rem); font-weight: 900; color: #fff;
          letter-spacing: -0.04em; line-height: 1.08; margin-bottom: 0.9rem;
          text-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .dd-hero-desc {
          font-size: 1.05rem; color: rgba(255,255,255,0.68); line-height: 1.65;
          max-width: 640px; margin-bottom: 1.4rem;
        }
        .dd-skill-row { display: flex; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap; }
        .dd-skill-label { font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.4); white-space: nowrap; padding-top: 0.4rem; }
        .dd-skill-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .dd-skill-chip {
          display: inline-flex; align-items: center; gap: 0.3rem;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.88); padding: 0.3rem 0.75rem;
          border-radius: 100px; font-size: 0.8rem; font-weight: 600;
          backdrop-filter: blur(4px);
        }

        /* Hero KPIs */
        .dd-hero-kpis {
          display: flex; flex-direction: column; gap: 0.65rem;
          flex-shrink: 0; min-width: 220px;
        }
        .dd-kpi {
          display: flex; align-items: center; gap: 0.9rem;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px; padding: 0.9rem 1.1rem;
          backdrop-filter: blur(8px); transition: background 0.2s;
        }
        .dd-kpi:hover { background: rgba(255,255,255,0.13); }
        .dd-kpi-val { font-size: 1rem; font-weight: 800; color: #fff; }
        .dd-kpi-label { font-size: 0.72rem; color: rgba(255,255,255,0.5); margin-top: 0.1rem; font-weight: 500; }

        /* ═══ Body Layout ═══ */
        .dd-body { padding-top: 2rem; }
        .dd-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 2rem; align-items: start;
        }
        .dd-left { display: flex; flex-direction: column; gap: 1.5rem; }
        .dd-right { position: sticky; top: 88px; }

        /* ═══ Sections ═══ */
        .dd-section {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 18px; padding: 1.75rem 2rem;
          box-shadow: 0 2px 16px rgba(15,23,42,0.05);
        }
        .dd-section-label {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.72rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: #4f46e5; margin-bottom: 1.25rem;
          background: #eff0ff; padding: 0.3rem 0.85rem; border-radius: 100px;
        }

        /* About grid */
        .dd-about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .dd-about-item { display: flex; gap: 0.85rem; align-items: flex-start; padding: 1rem; background: #fafbff; border: 1px solid #e8edf5; border-radius: 12px; }
        .dd-about-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dd-about-title { font-size: 0.88rem; font-weight: 700; color: #0f172a; margin-bottom: 0.2rem; }
        .dd-about-desc { font-size: 0.78rem; color: #64748b; line-height: 1.45; }

        /* Curriculum */
        .dd-curriculum { display: flex; flex-direction: column; }
        .dd-cur-row { display: flex; gap: 1.1rem; }
        .dd-cur-left { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; padding-top: 0.1rem; }
        .dd-cur-dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 3px rgba(79,70,229,0.15); }
        .dd-cur-line { flex: 1; width: 2px; background: linear-gradient(180deg, #c7d2fe 0%, #e0e7ff 100%); margin: 0.4rem 0; min-height: 2.5rem; }
        .dd-cur-body { padding-bottom: 1.5rem; padding-top: 0; flex: 1; }
        .dd-cur-row:last-child .dd-cur-body { padding-bottom: 0; }
        .dd-cur-week-row { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem; }
        .dd-cur-week { font-size: 0.68rem; font-weight: 800; padding: 0.22rem 0.6rem; border-radius: 100px; letter-spacing: 0.03em; }
        .dd-cur-phase { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .dd-cur-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-bottom: 0.3rem; }
        .dd-cur-desc { font-size: 0.8rem; color: #64748b; line-height: 1.5; }

        /* Inclusions */
        .dd-inc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.9rem; }
        .dd-inc-card {
          display: flex; flex-direction: column; gap: 0.5rem;
          padding: 1.1rem; border: 1px solid #e2e8f0; border-radius: 14px;
          background: #fafbff; transition: all 0.18s; cursor: default;
        }
        .dd-inc-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; }
        .dd-inc-title { font-size: 0.84rem; font-weight: 700; color: #0f172a; }
        .dd-inc-desc { font-size: 0.75rem; color: #64748b; line-height: 1.45; }

        /* ═══ Config Section ═══ */
        .dd-config-section { background: linear-gradient(145deg, #fafbff 0%, #f8fafc 100%); }
        .dd-config-header {
          display: flex; align-items: flex-start; gap: 1rem;
          padding-bottom: 1.5rem; border-bottom: 2px dashed #e2e8f0; margin-bottom: 1.5rem;
        }
        .dd-config-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; }
        .dd-config-sub { font-size: 0.84rem; color: #64748b; margin-top: 0.2rem; }

        /* Steps */
        .dd-step { margin-bottom: 1.75rem; padding-bottom: 1.75rem; border-bottom: 1px solid #e8edf5; }
        .dd-step:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .dd-step-head { display: flex; gap: 0.9rem; align-items: flex-start; margin-bottom: 1.25rem; }
        .dd-step-num {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #fff; font-weight: 800; font-size: 0.88rem;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(79,70,229,0.3);
        }
        .dd-step-title { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-bottom: 0.2rem; }
        .dd-step-sub { font-size: 0.82rem; color: #64748b; line-height: 1.5; }

        /* Duration picker */
        .dd-dur-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 0.75rem; }
        .dd-dur-btn {
          display: flex; flex-direction: column; gap: 0;
          text-align: left; border: 2px solid #e2e8f0;
          background: #fff; border-radius: 12px; padding: 1rem 1.1rem;
          cursor: pointer; transition: all 0.18s; font-family: inherit;
        }
        .dd-dur-btn:hover { border-color: #818cf8; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79,70,229,0.1); }
        .dd-dur-sel { border-color: #4f46e5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.14), 0 6px 20px rgba(79,70,229,0.12) !important; }
        .dd-dur-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.65rem; }
        .dd-dur-left-info { display: flex; align-items: center; gap: 0.6rem; }
        .dd-dur-radio {
          width: 17px; height: 17px; border-radius: 50%; border: 2px solid #cbd5e1;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.15s;
        }
        .dd-dur-radio.sel { border-color: #4f46e5; background: #eff0ff; }
        .dd-dur-radio.sel span { width: 7px; height: 7px; border-radius: 50%; background: #4f46e5; display: block; }
        .dd-dur-name { font-size: 0.92rem; font-weight: 700; color: #0f172a; }
        .dd-dur-meta { font-size: 0.7rem; color: #94a3b8; margin-top: 0.1rem; }
        .dd-dur-price { font-size: 1.1rem; font-weight: 900; color: #94a3b8; }
        .dd-dur-price.sel { color: #4f46e5; }
        .dd-dur-feats {
          display: flex; gap: 0.5rem; flex-wrap: wrap;
          padding-top: 0.6rem; border-top: 1px dashed #e8edf5;
        }
        .dd-dur-feats span { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.7rem; color: #475569; font-weight: 500; }

        /* Date inputs */
        .dd-dates-row { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
        .dd-date-field { flex: 1; display: flex; flex-direction: column; gap: 0.35rem; }
        .dd-date-sep { font-size: 1.3rem; color: #94a3b8; padding-top: 1.9rem; flex-shrink: 0; }
        .dd-label {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.82rem; font-weight: 700; color: #1e293b;
        }
        .dd-input {
          width: 100%; padding: 0.78rem 1rem; border: 2px solid #e2e8f0;
          border-radius: 10px; font-size: 0.9rem; font-weight: 600;
          color: #0f172a; background: #fff; font-family: inherit;
          transition: all 0.2s; box-sizing: border-box;
        }
        .dd-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.12); outline: none; }
        .dd-input-auto { background: #f8fafc; color: #475569; cursor: default; }
        .dd-hint { font-size: 0.72rem; color: #94a3b8; }
        .dd-notice-amber {
          display: flex; align-items: flex-start; gap: 0.65rem;
          background: #fffbeb; border: 1px solid #fde68a;
          padding: 0.85rem 1rem; border-radius: 10px;
          font-size: 0.82rem; color: #92400e; line-height: 1.55;
        }

        /* Student info */
        .dd-student-info { display: flex; flex-direction: column; gap: 1rem; }
        .dd-student-prefilled {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
        }
        .dd-prefilled-field {
          display: flex; gap: 0.65rem; align-items: flex-start;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 10px; padding: 0.85rem 1rem;
        }
        .dd-pf-icon { width: 24px; height: 24px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dd-pf-label { font-size: 0.72rem; color: #64748b; font-weight: 600; margin-bottom: 0.15rem; }
        .dd-verified { color: #059669; font-weight: 700; }
        .dd-pf-val { font-size: 0.88rem; font-weight: 700; color: #0f172a; }
        .dd-college-field { display: flex; flex-direction: column; gap: 0.4rem; }

        /* ═══ Sticky Sidebar ═══ */
        .dd-sticky-panel { display: flex; flex-direction: column; gap: 1rem; }
        .dd-app-card {
          background: linear-gradient(145deg, #1e1b4b 0%, #312e81 60%, #1e3a5f 100%);
          border-radius: 20px; padding: 1.6rem;
          box-shadow: 0 20px 50px rgba(79,70,229,0.35), 0 4px 15px rgba(0,0,0,0.2);
          display: flex; flex-direction: column; gap: 1rem;
          position: relative; overflow: hidden;
        }
        .dd-app-card::before {
          content: ''; position: absolute; top: -40%; right: -20%;
          width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%);
          pointer-events: none;
        }
        .dd-app-card-top { display: flex; align-items: center; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); position: relative; z-index: 1; }
        .dd-oc-seal { display: flex; align-items: center; gap: 0.4rem; font-size: 0.68rem; font-weight: 800; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.06em; }
        .dd-instant-pill { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.68rem; font-weight: 700; color: #34d399; background: rgba(52,211,153,0.15); padding: 0.22rem 0.65rem; border-radius: 100px; border: 1px solid rgba(52,211,153,0.3); }
        .dd-pulse { width: 7px; height: 7px; border-radius: 50%; background: #34d399; animation: pulseDot 1.8s infinite; display: inline-block; }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }

        .dd-app-domain { position: relative; z-index: 1; }
        .dd-app-cat { font-size: 0.65rem; font-weight: 800; color: #67e8f9; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.3rem; }
        .dd-app-name { font-size: 1.25rem; font-weight: 900; color: #fff; line-height: 1.2; margin-bottom: 0.5rem; }
        .dd-app-track { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.08); padding: 0.22rem 0.7rem; border-radius: 100px; }

        .dd-app-breakdown { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.55rem; position: relative; z-index: 1; }
        .dd-ab-row { display: flex; align-items: flex-start; justify-content: space-between; font-size: 0.82rem; color: rgba(255,255,255,0.5); gap: 0.5rem; }
        .dd-ab-row strong { color: #fff; font-size: 0.82rem; text-align: right; }
        .dd-ab-college strong { max-width: 150px; word-break: break-word; }
        .dd-ab-divider { height: 1px; background: rgba(255,255,255,0.12); margin: 0.1rem 0; }
        .dd-ab-fee-row { display: flex; align-items: center; justify-content: space-between; }
        .dd-fee-label { font-size: 0.88rem; font-weight: 700; color: #fff; }
        .dd-fee-note { font-size: 0.68rem; color: rgba(255,255,255,0.4); margin-top: 0.1rem; }
        .dd-fee-amount { font-size: 2.1rem; font-weight: 900; color: #a5f3fc; letter-spacing: -0.03em; line-height: 1; }

        .dd-cred-list { display: flex; flex-direction: column; gap: 0.45rem; position: relative; z-index: 1; }
        .dd-cred-title { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.35); margin-bottom: 0.2rem; }
        .dd-cred-row { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.78rem; color: rgba(255,255,255,0.78); font-weight: 500; line-height: 1.4; }

        .dd-cta-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #7c3aed 100%);
          color: #fff; border: none; border-radius: 12px; padding: 1rem 1.25rem;
          font-size: 0.95rem; font-weight: 800; cursor: pointer;
          box-shadow: 0 8px 24px rgba(79,70,229,0.5); transition: all 0.2s;
          font-family: inherit; letter-spacing: -0.01em; position: relative; z-index: 1;
        }
        .dd-cta-btn:hover { box-shadow: 0 12px 32px rgba(79,70,229,0.6); }

        .dd-trust { display: flex; justify-content: center; gap: 1.5rem; position: relative; z-index: 1; }
        .dd-trust span { display: flex; align-items: center; gap: 0.3rem; font-size: 0.68rem; color: rgba(255,255,255,0.35); font-weight: 500; }

        /* Help box */
        .dd-help-box {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          padding: 1.1rem 1.25rem; box-shadow: 0 2px 12px rgba(15,23,42,0.05);
        }
        .dd-help-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; font-weight: 700; color: #0f172a; margin-bottom: 0.4rem; }
        .dd-help-text { font-size: 0.8rem; color: #64748b; line-height: 1.55; }

        /* ═══ Responsive ═══ */
        @media (max-width: 1150px) {
          .dd-inc-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 1024px) {
          .dd-grid { grid-template-columns: 1fr; }
          .dd-right { position: static; }
          .dd-app-card { order: -1; }
        }
        @media (max-width: 860px) {
          .dd-hero-content { flex-direction: column; gap: 1.75rem; }
          .dd-hero-kpis { flex-direction: row; flex-wrap: wrap; min-width: unset; }
          .dd-kpi { flex: 1; min-width: 150px; }
          .dd-hero-band { padding: 2rem 0 2.5rem; }
        }
        @media (max-width: 768px) {
          .dd-about-grid { grid-template-columns: 1fr; }
          .dd-inc-grid { grid-template-columns: 1fr 1fr; }
          .dd-dur-grid { grid-template-columns: 1fr 1fr; }
          .dd-student-prefilled { grid-template-columns: 1fr; }
          .dd-section { padding: 1.4rem 1.25rem; border-radius: 14px; }
          .dd-dates-row { flex-direction: column; }
          .dd-date-sep { display: none; }
        }
        @media (max-width: 480px) {
          .dd-dur-grid { grid-template-columns: 1fr; }
          .dd-inc-grid { grid-template-columns: 1fr; }
          .dd-h1 { font-size: 1.75rem; }
        }
      `}</style>
    </div>
  );
}
