const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      _id: decoded.id,
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      companyId: decoded.companyId || null,
      employeeId: decoded.employeeId || null,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token invalid or expired",
    });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  allowRoles,
};