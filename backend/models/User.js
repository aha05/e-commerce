const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');

const addressSchema = new mongoose.Schema({
    country: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    homeNumber: { type: String }  // Optional
}, { _id: false }); // Prevent _id for subdocument unless needed

const userSchema = new mongoose.Schema({
    name: String,
    FirstName: { type: String },
    MiddleName: { type: String },
    LastName: { type: String },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: { type: String, required: true },
    image: String,
    status: {
        type: String,
        enum: ['active', 'blocked', 'deleted'],
        default: 'active'
    },
    phone: { String },
    address: addressSchema,
    wishlist: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            addedAt: { type: Date, default: Date.now },
        }
    ],
    googleId: String,
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
}, { timestamps: true });

userSchema.statics.getAdminUser = async function () {
    const Role = mongoose.model('Role'); // make sure Role model is registered

    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) return null;

    return this.findOne({ roles: adminRole._id }).populate('roles');
};

userSchema.statics.hasRole = async function (userId, roleNames) {
    const Role = mongoose.model('Role'); // ensure Role model is registered

    // Normalize input to an array
    const rolesToCheck = Array.isArray(roleNames) ? roleNames : [roleNames];

    // Fetch role documents matching the input names
    const roles = await Role.find({ name: { $in: rolesToCheck } });

    if (!roles.length) return false;

    const roleIds = roles.map(role => role._id);

    // Check if user has any of the given roles
    const user = await this.findOne({ _id: userId, roles: { $in: roleIds } });

    return !!user; // returns true if user exists with one of the roles
};

userSchema.statics.getAdminUsers = async function () {
    const Role = mongoose.model('Role');
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) return [];

    return this.find({ roles: adminRole._id }).populate('roles');
};

userSchema.statics.getUsersWithRole = async function (...roleNames) {
    const Role = mongoose.model('Role');

    // Flatten roleNames and normalize to lowercase strings
    roleNames = roleNames.flat().map(r => r.toLowerCase());

    if (roleNames.includes('all')) {
        return this.find().populate('roles');
    }

    const roles = await Role.find({ name: { $in: roleNames } });

    if (roles.length === 0) return [];

    const roleIds = roles.map(role => role._id);

    return this.find({ roles: { $in: roleIds } }).populate('roles');
};



userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

module.exports = User;

