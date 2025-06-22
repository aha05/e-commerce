const User = require('../Models/User');
const Role = require('../models/Role');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const createToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

exports.postRegister = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already in use" });
        }

        // Hash password and create user
        const role = await Role.findOne({ name: 'customer' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            username,
            roles: [role._id],
            email,
            password: hashedPassword
        });
        await user.save();

        const token = createToken(user._id);
        res.cookie("token", token, {
            httpOnly: true, // Can't be accessed by JavaScript
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            maxAge: 3600000, // 1 hour
        });

        res.json({
            message: "User registered! okay",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles.map(role => role.name) //! Extract role names
            },
        });
    } catch (err) {
        res.status(500).json({ error: "Registration failed" });
    }
};

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email }).populate({
            path: "roles",
            populate: { path: "permissions", select: "name" },
        });


        if (!user || (user.status != 'active')) {
            return res.status(401).json({ message: "Invalid User!" });
        }

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Create JWT token and store it in a cookie
        const token = createToken(user._id);
        res.cookie("token", token, {
            httpOnly: true, // Can't be accessed by JavaScript
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            maxAge: 3600000, // 1 hour
        });

        const permissions = user.roles
            .flatMap((role) => role.permissions.map((p) => p.name))
            .filter((v, i, arr) => arr.indexOf(v) === i);

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles.map(role => role.name), //! Extract role 
                permissions
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Login failed" });
    }
};

exports.logout = (req, res) => {
    res.clearCookie("token"); // Clear the JWT token cookie
    res.json({ message: "Logged out successfully" });
};

exports.session = async (req, res) => {
    try {
        const user = await User.findById(req.user)
            .select("-password")// Exclude password
            .populate({
                path: 'roles',
                populate: {
                    path: 'permissions',
                    select: 'name' // Only select permission name
                }
            });

        const permissions = user.roles
            .flatMap((role) => role.permissions.map((p) => p.name))
            .filter((v, i, arr) => arr.indexOf(v) === i);

        res.json({
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                image: user.image,
                email: user.email,
                roles: user.roles.map(role => role.name),
                permissions
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Could not fetch user data" });
    }
};



