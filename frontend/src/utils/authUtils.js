export const hasPermission = (user, ...permissions) => {
    if (!user || !user.permissions) return false;

    const required = permissions.flat(); // Flatten if passed as array or multiple args
    return required.some(p => user.permissions.includes(p));
};

export const isRole = (user, ...roles) => {
    if (!user || !user.roles) return false;

    const required = roles.flat();
    return required.some(role => user.roles.includes(role));
};
