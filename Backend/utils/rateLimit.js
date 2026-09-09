function createRateLimiter({ windowMs, max }) {
  const requests = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = String(req.ip || req.socket.remoteAddress || "unknown");
    const entry = requests.get(key);

    if (!entry || now - entry.startedAt >= windowMs) {
      requests.set(key, { startedAt: now, count: 1 });
    } else {
      entry.count += 1;
    }

    const active = requests.get(key);
    const remaining = Math.max(0, max - active.count);
    res.set({
      "RateLimit-Limit": String(max),
      "RateLimit-Remaining": String(remaining),
      "RateLimit-Reset": String(Math.ceil((active.startedAt + windowMs) / 1000)),
    });

    if (active.count > max) {
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }

    if (requests.size > 10000) {
      for (const [storedKey, storedEntry] of requests.entries()) {
        if (now - storedEntry.startedAt >= windowMs) {
          requests.delete(storedKey);
        }
      }
    }

    return next();
  };
}

module.exports = { createRateLimiter };
