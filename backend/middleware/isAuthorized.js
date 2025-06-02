// middleware/isAuthorized.js
const User = require('../Models/User');

const isAuthorized = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const user = req.user;

            if (!user || !user._id) {
                return res.status(401).json({ message: "Unauthorized!" });
            }

            const hasRole = await User.hasRole(user._id, allowedRoles);
            if (!hasRole) {
                return res.status(401).json({ message: "Unauthorized!" });
            }

            next(); // Authorized
        } catch (error) {
            console.error("Authorization error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    };
};

module.exports = isAuthorized;
