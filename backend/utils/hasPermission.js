const User = require('../Models/User');

module.exports = async function hasPermission(userId, permissionNames) {
    // Normalize to array
    if (!Array.isArray(permissionNames)) {
        permissionNames = [permissionNames];
    }

    // Load user with roles and permissions
    const user = await User.findById(userId).populate({
        path: 'roles',
        populate: { path: 'permissions' }
    });

    if (!user || !user.roles || user.roles.length === 0) {
        return false;
    }

    // Collect all permission names from user roles
    const userPermissions = user.roles.flatMap(role =>
        role.permissions.map(p => p.name)
    );

    // Check if user has ALL the requested permissions
    return permissionNames.every(p => userPermissions.includes(p));
};
