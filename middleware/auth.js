const jwt = require("jsonwebtoken");

const DEV_FALLBACK_SECRET = "chatterbox-global-pulse-fallback-secret-2026";

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  return DEV_FALLBACK_SECRET;
};

const extractToken = (req) => {
  const header = req.headers?.authorization;
  if (!header || typeof header !== "string") return null;
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] || null;
};

const requireAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired session" });
  }
};

const optionalAuth = (req, _res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, getJwtSecret());
    } catch {
      req.user = null;
    }
  }
  return next();
};

module.exports = { requireAuth, optionalAuth, getJwtSecret };
