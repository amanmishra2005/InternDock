import React from "react";

/**
 * InternDock brand mark — renders the official logo artwork (public/logo.png).
 */
export default function Logo({ size = 40, withWordmark = false, className = "" }) {
  return (
    <span
      className={`interndock-logo ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.65rem" }}
    >
      <img
        src="/logo.png"
        alt="InternDock"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain", borderRadius: "17%" }}
      />

      {withWordmark && (
        <span className="interndock-wordmark">
          <span className="interndock-wordmark-main">Intern<b>Dock</b></span>
        </span>
      )}

      <style>{`
        .interndock-wordmark-main {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--text-main);
        }
        .interndock-wordmark-main b {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
        }
      `}</style>
    </span>
  );
}
