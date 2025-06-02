// seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Permission = require('./models/Permission');
const Role = require('./models/Role');
const User = require('./models/User');
const data = require('./database/data');


dotenv.config();
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

const seedData = async () => {
    try {
        await Permission.deleteMany();
        await Role.deleteMany();
        await User.deleteMany();

        const insertedPermissions = await Permission.insertMany(data.permissions);
        const roles = data.createRoles(insertedPermissions);
        const insertedRoles = await Role.insertMany(roles);
        const users = await data.createUsers(insertedRoles);
        await User.insertMany(users);

        console.log('Permissions, Roles, and Users seeded!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
