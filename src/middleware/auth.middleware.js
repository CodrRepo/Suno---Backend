const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

async function verifyToken(req, res, next) {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
}

function requireArtist(req, res, next) {
  if (req.user?.profileType !== "artist") {
    return res.status(403).json({ message: "Forbidden: Only artists can perform this action" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.profileType !== "admin") {
    return res.status(403).json({ message: "Forbidden: Only admins can perform this action" });
  }
  next();
}

module.exports = { verifyToken, requireArtist, requireAdmin };
