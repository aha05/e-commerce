const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Permission = require('./models/Permission');
const Role = require('./models/Role');
const User = require('./models/User');
const { permissions } = require('./data/permissions');
const { createRoles } = require('./data/roles');
const { createUsers } = require('./data/users');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
        console.error('❌ MongoDB error:', err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        console.log('🌱 Seeding started...');

        // Permissions
        for (const perm of permissions) {
            await Permission.updateOne({ name: perm.name }, perm, { upsert: true });
        }
        const permissionDocs = await Permission.find();

        // Roles
        const roles = createRoles(permissionDocs);
        for (const role of roles) {
            await Role.updateOne({ name: role.name }, role, { upsert: true });
        }
        const roleDocs = await Role.find();

        // Users
        const users = await createUsers(roleDocs);
        for (const user of users) {
            const existing = await User.findOne({ email: user.email });
            if (!existing) await User.create(user);
        }

        console.log('✅ Seeding completed!');
        process.exit();
    } catch (err) {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    }
};

seedData();
