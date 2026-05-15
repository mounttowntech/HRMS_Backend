// middleware/roleMiddleware.js

const ROLES = {
  EMPLOYEE: "Employee",
  TEAM_LEAD: "Team Lead",
  PROJECT_MANAGER: "Project Manager",
  HR: "HR",
  ADMIN: "Admin",
};

exports.allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

exports.ROLES = ROLES;