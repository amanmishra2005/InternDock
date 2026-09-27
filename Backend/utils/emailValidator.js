const dns = require("dns").promises;

// Known disposable, temporary, and throwaway email domains
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "10minutesmail.com",
  "20minutemail.com",
  "armyspy.com",
  "burnermail.io",
  "crazymailing.com",
  "cuvox.de",
  "dayrep.com",
  "discard.email",
  "disposablemail.com",
  "dispostable.com",
  "drdrb.net",
  "dropmail.me",
  "emailondeck.com",
  "emailtemporal.org",
  "fackme.gq",
  "fakeinbox.com",
  "fakemailgenerator.com",
  "fakermail.com",
  "fleex.gq",
  "fleckens.hu",
  "getairmail.com",
  "getnada.com",
  "grr.la",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "gustr.com",
  "harakirimail.com",
  "inboxbear.com",
  "inboxkitten.com",
  "inboxproxy.com",
  "incognitomail.org",
  "jourrapide.com",
  "kasmail.com",
  "klzlk.com",
  "maildrop.cc",
  "mailcatch.com",
  "mailinator.com",
  "mailinator.net",
  "mailinator2.com",
  "mailnesia.com",
  "mailnull.com",
  "mailpoof.com",
  "mailtemporaire.fr",
  "meltmail.com",
  "mohmal.com",
  "mohmal.im",
  "mohmal.in",
  "mytrashmail.com",
  "mytemp.email",
  "nada.ltd",
  "nada.email",
  "nowmymail.com",
  "oneoffmail.com",
  "ownmail.net",
  "pokemail.net",
  "sharklasers.com",
  "spam4.me",
  "spambog.com",
  "spambox.us",
  "spamfree24.org",
  "spamgourmet.com",
  "superrito.com",
  "teleworm.us",
  "temp-mail.org",
  "temp-mail.io",
  "tempail.com",
  "tempinbox.com",
  "tempmail.com",
  "tempmail.net",
  "tempmailaddress.com",
  "throwawaymail.com",
  "throwawayemailaddress.com",
  "trashmail.com",
  "trashmail.net",
  "trashmail.org",
  "trashmail.me",
  "yopmail.com",
  "yopmail.net",
  "yopmail.fr",
  "zoemail.org",
]);

// Trusted consumer & academic providers that are guaranteed valid and can bypass DNS MX check
const TRUSTED_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "yahoo.co.uk",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "zoho.in",
  "rediffmail.com",
  "aol.com",
]);

// In-memory cache for validated domains to prevent redundant DNS lookups
const domainCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

function isDisposableDomain(domain) {
  const cleanDomain = String(domain || "").toLowerCase().trim();
  if (!cleanDomain) return false;

  if (DISPOSABLE_DOMAINS.has(cleanDomain)) return true;

  // Check if any sub-domain matches a disposable domain (e.g., mail.mailinator.com)
  const parts = cleanDomain.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parentDomain = parts.slice(i).join(".");
    if (DISPOSABLE_DOMAINS.has(parentDomain)) {
      return true;
    }
  }

  return false;
}

function isValidEmailSyntax(email) {
  if (typeof email !== "string") return false;
  const clean = email.trim();
  if (clean.length === 0 || clean.length > 254) return false;

  // Strict email format check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) return false;

  const [local, domain] = clean.split("@");
  if (!local || !domain) return false;
  if (local.length > 64) return false;
  if (domain.length > 253) return false;

  return true;
}

async function validateRegistrationEmail(email) {
  if (!email || typeof email !== "string") {
    return { isValid: false, reason: "Email address is required." };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Basic format & length check
  if (!isValidEmailSyntax(cleanEmail)) {
    return { isValid: false, reason: "Please provide a valid email address format." };
  }

  const [, domain] = cleanEmail.split("@");

  // 2. Disposable / temporary email provider blocklist check
  if (isDisposableDomain(domain)) {
    return {
      isValid: false,
      reason: "Disposable or temporary email addresses are not permitted. Please use a permanent email address (e.g. Gmail, Outlook, or university email).",
    };
  }

  // 3. Fast path for known trusted consumer & academic domains (.edu, .ac.in, etc.)
  if (
    TRUSTED_DOMAINS.has(domain) ||
    domain.endsWith(".edu") ||
    domain.endsWith(".edu.in") ||
    domain.endsWith(".ac.in") ||
    domain.endsWith(".ac.uk")
  ) {
    return { isValid: true, cleanEmail };
  }

  // 4. Cached domain lookup
  const cached = domainCache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    if (!cached.isValid) {
      return { isValid: false, reason: cached.reason };
    }
    return { isValid: true, cleanEmail };
  }

  // 5. Native DNS MX Record resolution
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      const reason = `The email domain "@${domain}" cannot receive emails (no MX records found).`;
      domainCache.set(domain, { isValid: false, reason, timestamp: Date.now() });
      return { isValid: false, reason };
    }

    // Check if the MX exchange host belongs to a known throwaway provider
    const isDisposableMx = mxRecords.some((r) =>
      /mailinator|guerrillamail|tempmail|trashmail|yopmail/i.test(r.exchange || "")
    );
    if (isDisposableMx) {
      const reason = "Disposable and temporary email addresses are not permitted.";
      domainCache.set(domain, { isValid: false, reason, timestamp: Date.now() });
      return { isValid: false, reason };
    }

    domainCache.set(domain, { isValid: true, timestamp: Date.now() });
    return { isValid: true, cleanEmail };
  } catch (err) {
    if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
      const reason = `The domain "@${domain}" does not exist or has no mail servers configured.`;
      domainCache.set(domain, { isValid: false, reason, timestamp: Date.now() });
      return { isValid: false, reason };
    }

    // On network/DNS timeouts, allow delivery so authentic custom domains aren't blocked by temporary network glitches
    return { isValid: true, cleanEmail };
  }
}

module.exports = {
  validateRegistrationEmail,
  isDisposableDomain,
  isValidEmailSyntax,
  DISPOSABLE_DOMAINS,
  TRUSTED_DOMAINS,
};
