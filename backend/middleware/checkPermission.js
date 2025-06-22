const hasPermission = require('../utils/hasPermission');

module.exports = function checkPermission(...permissions) {
    // Flatten all arguments into a single array
    const flatPermissions = permissions.flat(Infinity);

    return async (req, res, next) => {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const allowed = await hasPermission(req.user._id, flatPermissions);
        if (!allowed) {
            console.log("No Permission!")
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
};
