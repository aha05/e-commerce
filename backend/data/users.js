const bcrypt = require("bcryptjs");

module.exports.createUsers = async (roleDocs) => {
    const getRole = (name) => roleDocs.find(r => r.name === name)?._id;

    const users = [
        {
            name: "Admin",
            username: "admin",
            email: "admin@gmail.com",
            password: await bcrypt.hash("admin", 10),
            roles: [getRole("admin")]
        },
        {
            name: "Manager",
            username: "manager",
            email: "manager@gmail.com",
            password: await bcrypt.hash("manager", 10),
            roles: [getRole("manager")]
        },
        {
            name: "Sales",
            username: "sales",
            email: "sales@gmail.com",
            password: await bcrypt.hash("sales", 10),
            roles: [getRole("sales")]
        },
        {
            name: "User",
            username: "user",
            email: "user@gmail.com",
            password: await bcrypt.hash("customer", 10),
            roles: [getRole("customer")]
        }
    ];

    return users.map(u => ({
        ...u,
        status: "active",
        image: "https://i.pravatar.cc/150?img=3",
        wishlist: [],
        googleId: null
    }));
};
