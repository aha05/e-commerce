// middleware/authMiddleware.js
exports.isAuthenticated = (req, res, next) => {
    if (req.user) {
        return next();
    }
    console.log("Unauthorized: Please log in.");
    return res.status(401).json({ message: "Unauthorized: Please log in." });
};
