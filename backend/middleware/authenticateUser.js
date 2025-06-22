const jwt = require("jsonwebtoken");
const User = require('../Models/User'); // Adjust path as needed
const { json } = require("body-parser");

const authenticateUser = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Find user and populate role and permissions
        const user = await User.findById(decoded.userId)
            .select("-password")// Exclude password
            .populate({
                path: 'roles',
                populate: {
                    path: 'permissions',
                    select: 'name' // Only select permission name
                }
            });

        if (!user) {
            req.user = null;
            return next();
        }

        const permissions = user.roles
            .flatMap((role) => role.permissions.map((p) => p.name))
            .filter((v, i, arr) => arr.indexOf(v) === i);

        req.user = {
            _id: user._id,
            name: user.name,
            username: user.username,
            image: user.image,
            email: user.email,
            roles: user.roles.map(role => role.name),
            permissions
        } || null;

    } catch (err) {
        console.error("JWT verification failed:", err.message);
        req.user = null;
    }

    next();
};

module.exports = authenticateUser;
