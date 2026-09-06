function createRateLimiter({ windowMs, max }) {
  const requests = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const entry = requests.get(key);
    const active = !entry || now - entry.startedAt >= windowMs
      ? { startedAt: now, count: 0 }
      : entry;

    active.count += 1;
    requests.set(key, active);

    const remaining = Math.max(0, max - active.count);
    res.set({
      "RateLimit-Limit": String(max),
      "RateLimit-Remaining": String(remaining),
      "RateLimit-Reset": String(Math.ceil((active.startedAt + windowMs) / 1000)),
    });

    if (active.count > max) {
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }

    return next();
  };
}

module.exports = { createRateLimiter };
