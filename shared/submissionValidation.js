/**
 * GitHub Repository URL Validator for InternDock
 * 
 * Requirements:
 * - Must contain a valid, absolute HTTP or HTTPS URL.
 * - Hostname must be exactly "github.com" or a legitimate subdomain of "github.com", such as "www.github.com".
 * - Accepts valid repository links, for example:
 *   - https://github.com/username/repository
 *   - https://github.com/username/repository/tree/main
 *   - https://www.github.com/username/repository
 * - Rejects submissions with no GitHub URL, empty link, invalid URL, malformed URL, or link to another domain.
 * - Rejects misleading URLs such as:
 *   - https://github.com.example.com/repository
 *   - https://example.com/github.com
 * - Parses URLs using JavaScript's built-in URL API.
 */

const GITHUB_URL_ERROR_MESSAGE = "Invalid GitHub link. Please provide a valid GitHub repository URL.";

function isValidGithubUrl(urlString) {
  if (!urlString || typeof urlString !== "string") return false;
  const trimmed = urlString.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);

    // Must be absolute http or https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    // Hostname must be exactly github.com or legitimate subdomain like www.github.com
    const hostname = parsed.hostname.toLowerCase();
    const isGithub = hostname === "github.com" || hostname.endsWith(".github.com");
    if (!isGithub) {
      return false;
    }

    // Must contain repository path segments: /username/repository
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

// Support both CommonJS (Node.js) and ES Modules (Vite/Browser)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isValidGithubUrl,
    GITHUB_URL_ERROR_MESSAGE,
  };
}

export {
  isValidGithubUrl,
  GITHUB_URL_ERROR_MESSAGE,
};
