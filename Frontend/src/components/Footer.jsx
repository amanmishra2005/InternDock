import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageCircle,
  ArrowUpRight,
  Shield,
  Sparkles,
  ExternalLink,
  Code2,
  Globe,
} from "lucide-react";
import Logo from "./Logo";

const WHATSAPP_CHANNEL_URL =
  "https://whatsapp.com/channel/0029VbDhsUN3AzNbMjZikU0r";

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="container">
        {/* Top WhatsApp Channel CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="footer-newsletter-card glass-panel"
        >
          <div className="newsletter-text">
            <h3>
              <MessageCircle
                className="inline-icon"
                size={20}
                color="#25D366"
              />
              <span>Join InternDock on WhatsApp & LinkedIn</span>
            </h3>
            <p>
              Get domain roadmap updates, capstone project guides, and tech
              industry career tips — straight to WhatsApp, no inbox clutter.
              <br />
              <br />
              Follow InternDock on LinkedIn for certificate announcements,
              student highlights, and new internship opportunities.
            </p>
          </div>
          <div className="footer-cta-actions">
            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-glow whatsapp-cta-btn"
            >
              <svg
                className="social-cta-logo"
                width="19"
                height="19"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
              <span>Join Channel</span>
              <ArrowUpRight size={15} />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              href="https://www.linkedin.com/company/interndockindia"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-glow linkedin-cta-btn"
            >
              <svg
                className="social-cta-logo"
                width="19"
                height="19"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.762 2.239 5 5 5h14c2.762 0 5-2.238 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span>Follow on LinkedIn</span>
              <ArrowUpRight size={15} />
            </motion.a>
          </div>
        </motion.div>

        {/* Footer Navigation Columns */}
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-col brand-col">
            <Link to="/" className="footer-brand-link">
              <Logo size={38} className="footer-logo-img" />
              <span className="footer-brand-title">InternDock</span>
            </Link>
            <p className="footer-desc">
              InternDock is the next-generation internship platform. Build
              production-grade capstones, receive expert evaluations, and earn
              cryptographically verified credentials.
            </p>
            <div className="system-health-pill">
              <span className="pulse-dot"></span>
              <span className="health-text">
                All Systems Operational (API v1.0)
              </span>
            </div>
          </div>

          {/* Column 1: Popular Domains */}
          <div className="footer-col">
            <h4 className="footer-col-title">Popular Domains</h4>
            <ul className="footer-links">
              <li>
                <Link to="/domains">Full Stack Development</Link>
              </li>
              <li>
                <Link to="/domains">Web Development</Link>
              </li>
              <li>
                <Link to="/domains">Data Science & Analytics</Link>
              </li>
              <li>
                <Link to="/domains">Machine Learning & AI</Link>
              </li>
              <li>
                <Link to="/domains">Cloud & DevOps</Link>
              </li>
              <li>
                <Link to="/domains">Cybersecurity</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Platform */}
          <div className="footer-col">
            <h4 className="footer-col-title">Platform</h4>
            <ul className="footer-links">
              <li>
                <Link to="/login">Student Portal Login</Link>
              </li>
              <li>
                <Link to="/register">Apply for Internship</Link>
              </li>
              <li>
                <Link to="/verify/offer">Offer Verification</Link>
              </li>
              <li>
                <Link to="/verify/certificate">Certificate Verification</Link>
              </li>
              <li>
                <Link to="/#how-it-works">Curriculum Stepper</Link>
              </li>
              <li>
                <Link to="/#contact">Contact Us</Link>
              </li>
              <li>
                <a
                  href="https://whatsapp.com/channel/0029VbDhsUN3AzNbMjZikU0r"
                  target="_blank"
                  rel="noreferrer"
                >
                  Join our WhatsApp Channel
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/interndockindia"
                  target="_blank"
                  rel="noreferrer"
                >
                  Follow us on LinkedIn
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Security */}
          <div className="footer-col">
            <h4 className="footer-col-title">Trust & Security</h4>
            <ul className="footer-links">
              <li>
                <Link to="/privacy-policy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms">Terms of Service</Link>
              </li>
              <li>
                <Link to="/refund-policy">Refund & Cancellation Policy</Link>
              </li>
              <li>
                <Link to="/verify/certificate">Cryptographic Verification</Link>
              </li>
              <li>
                <a href="mailto:support@interndock.in">Contact Support</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Social Links */}
        <div className="footer-bottom-bar">
          <p className="copyright-text">
            © {new Date().getFullYear()} <strong>InternDock</strong>. All rights
            reserved.
          </p>
          <div className="social-links-group">
            <motion.a
              whileHover={{ y: -3, scale: 1.1 }}
              href="https://github.com/amanmishra2005/InternDock"
              target="_blank"
              rel="noreferrer"
              className="social-icon"
              aria-label="GitHub"
            >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </motion.a>
            <motion.a
              whileHover={{ y: -3, scale: 1.1 }}
              href="https://www.linkedin.com/company/interndockindia"
              target="_blank"
              rel="noreferrer"
              className="social-icon"
              aria-label="Follow InternDock on LinkedIn"
            >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </motion.a>
            <motion.a
              whileHover={{ y: -3, scale: 1.1 }}
              href="https://whatsapp.com/channel/0029VbDhsUN3AzNbMjZikU0r"
              target="_blank"
              rel="noreferrer"
              className="social-icon"
              aria-label="WhatsApp Channel"
            >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.479-8.413z" />
              </svg>
            </motion.a>
          </div>
        </div>
      </div>

      <style>{`
        .main-footer {
          background: #ffffff;
          border-top: 1px solid var(--border-color);
          padding: 4rem 0 2rem 0;
          margin-top: 5rem;
          position: relative;
        }
        .footer-newsletter-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          margin-bottom: 4rem;
          padding: 2.25rem 2.75rem;
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(124, 58, 237, 0.04) 100%);
          border: 1px solid rgba(79, 70, 229, 0.2);
        }
        .newsletter-text h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.4rem;
          font-weight: 800;
          margin-bottom: 0.4rem;
        }
        .inline-icon {
          display: inline-block;
        }
        .newsletter-text p {
          color: var(--text-muted);
          font-size: 0.925rem;
          max-width: 550px;
        }
        .newsletter-text .linkedin-footer-note {
          margin-top: 0.55rem;
          color: #475569;
          font-size: 0.86rem;
        }
        .newsletter-form {
          display: flex;
          gap: 0.75rem;
          min-width: 380px;
        }
        .whatsapp-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
          background: #25D366;
          border-color: #25D366;
        }
        .whatsapp-cta-btn:hover {
          background: #1fb855;
        }
        .footer-cta-actions { display: flex; flex-direction: column; align-items: stretch; gap: 0.75rem; min-width: 220px; }
        .footer-cta-actions .btn { width: 100%; }
        .linkedin-cta-btn { white-space: nowrap; }
        .subscribe-success-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(5, 150, 105, 0.1);
          border: 1px solid rgba(5, 150, 105, 0.25);
          color: #059669;
          padding: 0.75rem 1.4rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr repeat(3, 1fr);
          gap: 3rem;
          margin-bottom: 3.5rem;
        }
        .footer-brand-link {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .footer-logo-img {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
        }
        .footer-brand-title {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
        }
        .footer-desc {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 1.25rem;
          max-width: 340px;
        }
        .system-health-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(5, 150, 105, 0.08);
          border: 1px solid rgba(5, 150, 105, 0.2);
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-full);
        }
        .health-text {
          font-size: 0.775rem;
          color: #059669;
          font-weight: 600;
        }
        .footer-col-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1.25rem;
        }
        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin: 0;
          padding: 0;
        }
        .footer-links a {
          color: var(--text-muted);
          font-size: 0.9rem;
          transition: var(--transition-fast);
        }
        .footer-links a:hover {
          color: var(--primary);
          padding-left: 4px;
        }
        .footer-bottom-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 2rem;
          border-top: 1px solid var(--border-color);
        }
        .copyright-text {
          color: var(--text-subtle);
          font-size: 0.85rem;
        }
        .social-links-group {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .social-icon {
          color: var(--text-subtle);
          transition: var(--transition-fast);
        }
        .social-icon:hover {
          color: var(--primary);
        }
        @media (max-width: 1024px) {
          .footer-newsletter-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .footer-cta-actions { width: 100%; min-width: 0; }
          .newsletter-form {
            min-width: 100%;
          }
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
          .footer-bottom-bar {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
