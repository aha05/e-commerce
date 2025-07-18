const User = require('../../Models/User');
const Permission = require('../../models/Permission');
const Role = require('../../models/Role');
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const hasPermission = require('../../utils/hasPermission');
const logger = require('../../utils/logger.js');

exports.manageRole = async (req, res) => {
    try {
        const roles = await Role.find().populate('permissions'); // Populate permissions
        const permissions = await Permission.find(); // Fetch all permissions        
        res.json({ roles, permissions })
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching roles or permissions');
    }
}


exports.addRole = async (req, res) => {
    const { name, permissionIds } = req.body;
    try {
        if (name.toLowerCase() === 'admin' || name.toLowerCase() === 'customer') {
            return res.status(400).json({ message: 'Cannot add role' });
        }
        const role = new Role({ name, permissions: permissionIds });
        await role.save();
        res.json({ role })
        setImmediate(async () => {
            try {
                logger.info(`New role ${role.name} added by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log", error);
            }
        });
    } catch (error) {
        logger.error("❌ Failed to add new role:", error);
        res.status(500).send('Error adding role');
    }
}

exports.updateRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id).populate('permissions');
        const permissions = await Permission.find(); // Fetch all available permissions
        if (!role) return res.status(404).send('Role not found');
        res.json({ role, permissions })

    } catch (error) {
        logger.error("❌ Failed update role", error);
        res.status(500).send('Error fetching role data');
    }
}

exports.updateRolePost = async (req, res) => {
    const { name, permissionIds } = req.body;

    try {
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).send('Role not found');

        if (role.name.toLowerCase() === 'admin' || role.name.toLowerCase() === 'customer') {
            return res.status(400).json({ message: 'Cannot update admin role' });
        }

        role.name = name; // Update role name
        role.permissions = permissionIds; // Update associated permissions
        await role.save();
        res.json({ role })

        setImmediate(async () => {
            try {
                logger.info(`Role "${role.name}" updated by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log", error);
            }
        });
    } catch (error) {
        logger.error("❌ Failed to update role", error);
        res.status(500).send('Error updating role');
    }
}

exports.deleteRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        if (role.name.toLowerCase() === 'admin' || role.name.toLowerCase() === 'customer') {
            return res.status(400).json({ message: 'Cannot delete admin role' });
        }

        await Role.findByIdAndDelete(req.params.id);
        res.json({ message: 'Role deleted successfully', role });

        setImmediate(async () => {
            try {
                logger.info(`Role "${role.name}" deleted by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log", error);
            }
        });
    } catch (error) {
        console.error(error);
        logger.error("❌ Error deleting role", error);
        res.status(500).send('Error deleting role');
    }
}

exports.assignRole = async (req, res) => {
    const { userId, roleId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');

        user.roles.push(roleId); // Add role
        await user.save();

        setImmediate(async () => {
            try {
                logger.info(`Role "${user.roles.name}" assigned to ${user.username} by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log", error);
            }
        });
    } catch (error) {
        logger.error("❌ Error to assign role to user", error);
        res.status(500).send('Error assigning role');
    }
}

exports.allUsers = async (req, res) => {
    try {
        const users = await User.find().populate('roles').lean();
        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Server Error');
    }
}

exports.createUser = async (req, res) => {
    const roles = await Role.find()
    res.json(roles);
}

exports.createUserPost = async (req, res) => {
    const { name, username, email, password, roleId } = req.body;
    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ message: 'Email or username already in use.' });
        }
        // 4. Determine roles to assign
        let assignedRoles = [];

        const canAssignRoles = await hasPermission(req.user._id, 'assign_roles');
        if (canAssignRoles && roleId) {
            const roleIdsArray = Array.isArray(roleId) ? roleId : [roleId];

            const validRoles = await Role.find({ _id: { $in: roleIdsArray } });
            if (validRoles.length !== roleIdsArray.length) {
                return res.status(400).json({ message: 'One or more roles are invalid.' });
            }

            assignedRoles = roleIdsArray;
        } else {
            // Assign default "user" role
            const defaultRole = await Role.findOne({ name: 'user' });
            if (!defaultRole) {
                return res.status(500).json({ message: 'Default user role not found.' });
            }
            assignedRoles = [defaultRole._id];
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, username, email, password: hashedPassword, roles: assignedRoles });
        await user.save();
        res.status(201).json({ message: "User created successfully!", user });

        setImmediate(async () => {
            try {
                logger.info(`New user "${name}" add by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log", error);
            }
        });
    } catch (error) {
        logger.error("❌ Error adding user:", error);
        res.status(500).send('Server Error');
    }
}

exports.getEditUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('roles').lean();
        const roles = await Role.find();
        res.json({ user, roles });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Server Error');
    }
}

exports.userUpdate = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findOne({ _id: req.params.id }).populate('roles');
    if (user.roles.some(role => role.name === 'admin'))
        return res.status(403).json({ error: 'Access denied.' });

    try {
        const user = await User.findByIdAndUpdate(id, { status });
        res.json({ user });

        setImmediate(async () => {
            try {
                logger.info(`User "${user.name}" has been ${status} by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log", error);
            }
        });
    } catch (error) {
        logger.error("❌ Error updating user status:", error);
        res.status(500).send('Internal Server Error');
    }
}

exports.editUserPost = async (req, res) => {
    const { name, username, email, roleId } = req.body;

    try {
        const user = await User.findOne({ _id: req.params.id }).populate('roles');
        if (user.roles.some(role => role.name === 'admin'))
            return res.status(403).json({ error: 'Access denied.' });

        let rolesArray = user.roles.map(role => role._id);

        if (await hasPermission(req.user._id, 'assign_roles')) {
            if (roleId) {
                rolesArray = Array.isArray(roleId) ? roleId : [roleId];
            }
        }

        await User.findByIdAndUpdate(req.params.id, { name, username, email, roles: rolesArray });
        res.json({ user });

        setImmediate(async () => {
            try {
                logger.info(`User "${user.name}" updated by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log", error);
            }
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        logger.error("❌ Error updating user:", error);
        res.status(500).send('Server Error');
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id }).populate('roles')

        if (user.roles.some(role => role.name === 'admin'))
            return res.status(403).json({ error: 'Access denied.' });

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "User deleted successfully" });

        setImmediate(async () => {
            try {
                logger.info(`User "${user.name}" deleted by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log", error);
            }
        });
    } catch (error) {
        logger.error("❌ Error deleting user:", error);
        res.status(500).send('Server Error');
    }
}