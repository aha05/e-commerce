
const User = require('../Models/User');
const Order = require('../models/Order');
const bcrypt = require("bcryptjs");
const { convertPrice } = require('../utils/currencyConverter');


// Display user profile page
exports.getProfile = async (req, res) => {
    try {
        const cart = req.session.cart;
        const user = await User.findById(req.user._id); // Assuming user is authenticated
        const orders = await Order.find({ userId: req.user._id }).populate('items.productId').sort({ createdAt: -1 }); // Find all orders for the user


        const updatedOrders = orders.map(order => ({
            ...order.toObject(),
            orderTotal: convertPrice(order.orderTotal, req.currency),
            currency: req.currency
        }));

        res.json({ user, orders: updatedOrders, cart })
    } catch (error) {
        console.error('Error loading profile:', error);
        res.status(500).send('Error loading profile');
    }
}

exports.editProfile = async (req, res) => {
    let {
        FirstName,
        LastName,
        MiddleName,
        email,
        username,
        phone,
        address: {
            country,
            city,
            address,
            postalCode,
            homeNumber
        } } = req.body;
    try {
        const user = await User.findOne({ _id: req.params.id });
        if (phone && !phone.startsWith('+')) {
            phone = '+' + phone;
        }
        
        await User.findByIdAndUpdate(req.params.id, {
            FirstName,
            LastName,
            MiddleName,
            email,
            username,
            phone,
            address: {
                country,
                city,
                address,
                postalCode,
                homeNumber
            }
        });
        res.json({ user });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Server Error');
    }
}

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findOne({ _id: req.params.id });

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
        res.json({ user });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Server Error');
    }
}

exports.updateImage = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        if (user.image && user.image && user.image !== image) {
            const oldImagePath = path.join(__dirname, "..", "public", user.image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath); // Delete old file
            }
        }

        // Assign new image path (if a new image is uploaded)
        const imagePath = req.file ? `/uploads/${req.file.filename}` : user.image;

        await User.findByIdAndUpdate(req.params.id, { image: imagePath });
        res.json({ user });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Server Error');
    }

}

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id }).populate('roles')

        if (user.roles.some(role => role.name === 'admin'))
            return res.status(403).json({ error: 'Access denied.' });

        await User.findByIdAndDelete(req.params.id);

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Server Error');
    }
}

exports.getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist.productId');
        res.render('wishlist', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}

exports.addWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.body;
        const user = await User.findById(userId);

        if (user.wishlist.some(item => item.productId.toString() === productId)) {
            return res.status(400).send('Product already in wishlist'); // Handle duplicate case
        }

        await User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { wishlist: { productId } } },
            { new: true }
        );
        res.redirect('/wishlist');
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to add to wishlist');
    }
}

exports.deleteWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { wishlist: { productId } } }
        );
        res.redirect('/wishlist');
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to remove from wishlist');
    }
}






