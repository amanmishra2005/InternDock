/**
 * Anti-Bot & CAPTCHA Protection
 * Provides 100% free multi-layered protection:
 * 1. Honeypot decoy field detection
 * 2. Rapid submission timing heuristics (humans take >2s to fill out registration forms)
 * 3. Cloudflare Turnstile token verification (100% free, privacy-preserving managed challenge)
 */

async function verifyTurnstileToken(token, remoteIp) {
  const secretKey = (process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "").trim();

  // If secret key is not set in environment (e.g. local dev / tests), allow bypass with honeypot + timing
  if (!secretKey) {
    return { success: true, bypassed: true };
  }

  if (!token) {
    return {
      success: false,
      message: "Anti-bot verification required. Please complete the security check.",
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => ({}));
    if (!data.success) {
      console.warn("[ANTI-BOT] Cloudflare Turnstile verification rejected:", data["error-codes"]);
      return {
        success: false,
        message: "Anti-bot verification failed. Please refresh the page and try again.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("[ANTI-BOT ERROR] Turnstile verification exception:", err.message);
    // If Turnstile service is down or times out, fail securely or allow if dev
    if (process.env.NODE_ENV !== "production") {
      return { success: true, bypassed: true };
    }
    return {
      success: false,
      message: "Anti-bot service is temporarily unavailable. Please retry in a moment.",
    };
  }
}

function checkHoneypot(body = {}) {
  // Common honeypot field names populated by automated scripts
  const honeypotFields = ["hp_website", "website", "company_fax", "confirm_email_address"];
  for (const field of honeypotFields) {
    if (body[field] && String(body[field]).trim().length > 0) {
      return { isBot: true, field };
    }
  }
  return { isBot: false };
}

function checkSubmissionTiming(formStartTime, minSeconds = 1.5) {
  if (!formStartTime) return { isTooFast: false };

  const startTime = Number(formStartTime);
  if (Number.isNaN(startTime) || startTime <= 0) return { isTooFast: false };

  const durationMs = Date.now() - startTime;
  if (durationMs < minSeconds * 1000) {
    return { isTooFast: true, durationMs };
  }

  return { isTooFast: false, durationMs };
}

async function validateRegistrationAntiBot(req) {
  const body = req.body || {};

  // 1. Honeypot Check
  const honeypot = checkHoneypot(body);
  if (honeypot.isBot) {
    console.warn(`[ANTI-BOT REJECTION] Bot trapped in honeypot field "${honeypot.field}" from IP: ${req.ip}`);
    return {
      passed: false,
      status: 400,
      message: "Automated registration request detected.",
    };
  }

  // 2. Submission Timing Check (Skip in test environments)
  if (process.env.NODE_ENV !== "test" && body.formStartTime) {
    const timing = checkSubmissionTiming(body.formStartTime, 1.5);
    if (timing.isTooFast) {
      console.warn(`[ANTI-BOT REJECTION] Form submitted suspiciously fast (${timing.durationMs}ms) from IP: ${req.ip}`);
      return {
        passed: false,
        status: 400,
        message: "Form was submitted unnaturally fast. Please try again.",
      };
    }
  }

  // 3. Cloudflare Turnstile Check
  const turnstileToken = body.turnstileToken || body["cf-turnstile-response"];
  const turnstileResult = await verifyTurnstileToken(turnstileToken, req.ip);
  if (!turnstileResult.success) {
    return {
      passed: false,
      status: 400,
      message: turnstileResult.message,
    };
  }

  return { passed: true };
}

module.exports = {
  validateRegistrationAntiBot,
  verifyTurnstileToken,
  checkHoneypot,
  checkSubmissionTiming,
};
