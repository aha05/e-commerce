const jwt = require("jsonwebtoken");
const User = require('../Models/User'); // Adjust path as needed

const authenticateUser = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password"); // Exclude password
        req.user = user || null;


    } catch (err) {
        req.user = null;
    }

    next();
};

module.exports = authenticateUser;
