import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Compass, ShieldCheck, LayoutDashboard, User, LogOut, Menu, X, ArrowRight, Layers, Mail } from "lucide-react";
import Logo from "./Logo";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky-header">
      <div className="container header-container">
        {/* Brand Logo & Name */}
        <Link to="/" className="brand-logo-group">
          <motion.div 
            className="brand-icon-wrapper"
            whileHover={{ scale: 1.08, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
          >
            <Logo size={44} className="brand-icon" />
          </motion.div>
          <div className="brand-text-container">
            <span className="brand-name">InternDock</span>
            <span className="brand-tagline">Tech Talent Platform</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          <a href="/#features" className="nav-link">
            <Sparkles className="nav-icon" size={16} />
            <span>Features</span>
          </a>
          <a href="/#how-it-works" className="nav-link">
            <Layers className="nav-icon" size={16} />
            <span>How it Works</span>
          </a>
          <Link to="/domains" className={`nav-link ${isActive("/domains") ? "active" : ""}`}>
            <Compass className="nav-icon" size={16} />
            <span>Domains</span>
          </Link>
          <Link to="/verify/offer/sample" className={`nav-link ${location.pathname.includes('/verify') ? "active" : ""}`}>
            <ShieldCheck className="nav-icon" size={16} />
            <span>Verification</span>
          </Link>
          <a href="/#contact" className="nav-link">
            <Mail className="nav-icon" size={16} />
            <span>Contact</span>
          </a>
          {user && (
            <Link to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}>
              <LayoutDashboard className="nav-icon" size={16} />
              <span>Workspace</span>
            </Link>
          )}
          {user && user.role === "admin" && (
            <Link to="/admin" className={`nav-link admin-nav-pill ${location.pathname.includes('/admin') ? "active" : ""}`}>
              <Sparkles className="nav-icon" size={15} />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          {token && user ? (
            <div className="user-profile-menu">
              <div className="user-info-chip">
                <span className="user-avatar-circle">{user.fullName ? user.fullName[0].toUpperCase() : "U"}</span>
                <span className="user-name-text">{user.fullName}</span>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout} 
                className="btn btn-secondary btn-sm"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </motion.button>
            </div>
          ) : (
            <div className="auth-buttons-group">
              <Link to="/login">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="btn btn-secondary btn-sm">
                  Sign In
                </motion.button>
              </Link>
              <Link to="/register">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="btn btn-primary btn-sm btn-glow">
                  <span>Apply Now</span>
                  <ArrowRight size={14} />
                </motion.button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="mobile-toggle-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={24} color="#0f172a" /> : <Menu size={24} color="#0f172a" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mobile-drawer"
          >
            <a href="/#features" onClick={() => setMobileOpen(false)} className="mobile-nav-item">
              <Sparkles size={18} />
              <span>Features</span>
            </a>
            <a href="/#how-it-works" onClick={() => setMobileOpen(false)} className="mobile-nav-item">
              <Layers size={18} />
              <span>How it Works</span>
            </a>
            <Link to="/domains" onClick={() => setMobileOpen(false)} className="mobile-nav-item">
              <Compass size={18} />
              <span>Explore Domains</span>
            </Link>
            <Link to="/verify/offer/sample" onClick={() => setMobileOpen(false)} className="mobile-nav-item">
              <ShieldCheck size={18} />
              <span>Certificate Verification</span>
            </Link>
            <a href="/#contact" onClick={() => setMobileOpen(false)} className="mobile-nav-item">
              <Mail size={18} />
              <span>Contact</span>
            </a>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="mobile-nav-item">
                  <LayoutDashboard size={18} />
                  <span>My Dashboard</span>
                </Link>
                {user.role === "admin" && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="mobile-nav-item">
                    <User size={18} />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="btn btn-secondary full-width">
                  <LogOut size={16} />
                  <span>Logout ({user.fullName})</span>
                </button>
              </>
            ) : (
              <div className="mobile-auth-stack">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn btn-secondary full-width">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn btn-primary full-width btn-glow">
                  Apply Now
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
        }
        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 76px;
        }
        .brand-logo-group {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        .brand-icon-wrapper {
          display: flex;
          align-items: center;
        }
        .brand-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          object-fit: cover;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.25);
        }
        .brand-text-container {
          display: flex;
          flex-direction: column;
        }
        .brand-name {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #0f172a 0%, #4f46e5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .brand-tagline {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 1.75rem;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.925rem;
          font-weight: 600;
          color: var(--text-muted);
          position: relative;
          padding: 0.4rem 0.6rem;
          border-radius: var(--radius-xs);
          transition: var(--transition-fast);
        }
        .nav-link:hover, .nav-link.active {
          color: var(--primary);
          background: rgba(79, 70, 229, 0.06);
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0.6rem;
          right: 0.6rem;
          height: 2.5px;
          background: linear-gradient(90deg, var(--primary), var(--accent-purple));
          border-radius: var(--radius-full);
        }
        .nav-icon {
          color: var(--primary);
        }
        .admin-nav-pill {
          background: rgba(124, 58, 237, 0.08) !important;
          border: 1px solid rgba(124, 58, 237, 0.25) !important;
          color: var(--accent-purple) !important;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .status-indicator-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(5, 150, 105, 0.08);
          border: 1px solid rgba(5, 150, 105, 0.2);
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-full);
        }
        .status-text {
          font-size: 0.75rem;
          font-weight: 700;
          color: #059669;
        }
        .user-profile-menu {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .user-info-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #ffffff;
          padding: 0.3rem 0.8rem 0.3rem 0.35rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card);
        }
        .user-avatar-circle {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent-purple));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.75rem;
          color: #ffffff;
        }
        .user-name-text {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-main);
        }
        .auth-buttons-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .mobile-toggle-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.4rem;
        }
        .mobile-drawer {
          overflow: hidden;
          background: #ffffff;
          border-bottom: 1px solid var(--border-color);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        }
        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-main);
          padding: 0.6rem 0;
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
        }
        .full-width {
          width: 100%;
        }
        @media (max-width: 900px) {
          .desktop-nav, .status-indicator-badge {
            display: none;
          }
          .mobile-toggle-btn {
            display: flex;
          }
        }
      `}</style>
    </header>
  );
}
