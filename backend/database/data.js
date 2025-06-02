const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

module.exports.permissions = [
    { name: 'VIEW_USER', description: 'Can view users' },
    { name: 'EDIT_USER', description: 'Can edit users' },
    { name: 'DELETE_USER', description: 'Can delete users' },
    { name: 'CREATE_PRODUCT', description: 'Can create products' },
];

// data/roles.js (factory-style using resolved permission IDs)
module.exports.createRoles = (permissionDocs) => {
    const viewUser = permissionDocs.find(p => p.name === 'VIEW_USER');
    const editUser = permissionDocs.find(p => p.name === 'EDIT_USER');
    const deleteUser = permissionDocs.find(p => p.name === 'DELETE_USER');

    return [
        {
            name: 'admin',
            permissions: permissionDocs.map(p => p._id) // all permissions
        },
        {
            name: 'user',
            permissions: [viewUser?._id].filter(Boolean) // only VIEW_USER
        },
        {
            name: 'customer',
            permissions: [viewUser?._id].filter(Boolean) // only VIEW_USER
        }
    ];
};

// data/users.js
module.exports.createUsers = async (roleDocs) => {
    const adminRole = roleDocs.find(r => r.name === 'admin');
    const userRole = roleDocs.find(r => r.name === 'user');
    const adminPassword = await bcrypt.hash("admin", 10);
    const userPassword = await bcrypt.hash("user", 10);

    return [
        {
            name: "Admin",
            email: "admin@gmail.com",
            username: "admin",
            password: adminPassword,
            image: "https://i.pravatar.cc/150?img=3",
            status: "active",
            wishlist: [],
            googleId: null,
            roles: [adminRole?._id].filter(Boolean)
        },
        {
            name: "User",
            email: "user@gmail.com",
            username: "user",
            password: userPassword,
            image: "https://i.pravatar.cc/150?img=4",
            status: "active",
            wishlist: [],
            googleId: null,
            roles: [userRole?._id].filter(Boolean)
        }
    ];
};



