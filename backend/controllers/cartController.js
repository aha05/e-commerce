// routes/cartRoutes.js

const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const { convertPrice } = require('../utils/currencyConverter');
const UserSettings = require('../models/UserSettings');




async function applyDiscount(products) {
    const now = new Date();
    const autoPromotions = await Promotion.find({
        type: 'auto',
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
    });

    // handle both single and multiple products
    products = !Array.isArray(products) ? [products] : products;

    // Apply matching promotion to each product
    const productsWithDiscount = products.map(product => {
        const promo = autoPromotions.find(p => p.product.toString() === product._id.toString());

        const discountAmount = promo
            ? (product.price * promo.discountPercentage) / 100
            : 0;

        const discount = promo ? product.price - discountAmount : product.price;

        const discountPercentage = promo ? promo.discountPercentage : 0;

        return {
            ...product,
            price: discount,
            discountPercentage
        };
    });

    return productsWithDiscount;
}

// GET cart details for logged-in user
exports.getCart = async (req, res) => {
    try {
        if (!req.user) {
            const productIds = req.session.cart.map(item => item.productId);

            const products = await Product.find({ _id: { $in: productIds } }).populate('category');

            const detailedCart = req.session.cart.map(item => {
                const product = products.find(p => p._id.toString() === item.productId);
                return product
                    ? {
                        ...product.toObject(), // Convert Mongoose document to plain object
                        quantity: item.quantity,
                    }
                    : null;
            }).filter(item => item !== null); // Remove items not found in the database
            const user = req.user;

            const formattedProducts = detailedCart.map(p => ({
                ...p,
                price: convertPrice(p.price, req.currency),
                currency: req.currency
            }));
            const productsWithDiscount = await applyDiscount(formattedProducts);

            res.json({ cart: productsWithDiscount, user });
        } else {

            const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
            const productIds = cart.items.map(items => items.productId);

            const products = await Product.find({ _id: { $in: productIds } }).populate('category');

            const detailedCart = cart?.items?.map(cartItem => {
                const product = products?.find(item => item?._id?.equals(cartItem?.productId?._id));

                return product
                    ? {
                        ...product.toObject(), // Convert Mongoose document to plain object
                        quantity: cartItem.quantity,
                    }
                    : null;
            }).filter(cartItem => cartItem !== null); // Remove items not found in the database
            const user = req.user;

            const formattedProducts = detailedCart.map(p => ({
                ...p,
                price: convertPrice(p.price, req.currency),
                currency: req.currency
            }));

            const productsWithDiscount = await applyDiscount(formattedProducts);
            const settings = await UserSettings.findOne({ userId: req.user._id });
            const currency = settings.preferences.currency;
            res.json({ cart: productsWithDiscount, user, currency });
        }

    } catch (err) {
        console.log('Error retrieving cart');
        res.status(500).send('Error retrieving cart');
    }
};


// Add product to cart
exports.addToCart = async (req, res) => {

    const { productId, quantity = 1 } = req.body;
    try {
        if (!req.user) {
            // Ensure the session has a cart
            if (!req.session.cart) {
                req.session.cart = [];
            }

            // Add product to the cart or update quantity if it exists
            const existingItemIndex = req.session.cart.findIndex(item => item.productId === productId);

            if (existingItemIndex > -1) {
                // Update quantity of existing product
                req.session.cart[existingItemIndex].quantity += parseInt(quantity);
            } else {
                // Add new product to the cart
                req.session.cart.push({ productId, quantity: parseInt(quantity) });
            }

            // Extract product IDs from the cart
            const productIds = req.session.cart.map(item => item.productId);

            // Query the database for product details
            const products = await Product.find({ _id: { $in: productIds } }).populate('category');

            // Map product details with quantities from the session cart
            const detailedCart = req.session.cart.map(item => {
                const product = products.find(p => p._id.toString() === item.productId);
                return product
                    ? {
                        ...product.toObject(), // Convert Mongoose document to plain object
                        quantity: item.quantity,
                    }
                    : null;
            }).filter(item => item !== null); // Remove items not found in the database

            // Save the session after modification
            req.session.save((err) => {
                if (err) {
                    console.error('Error saving session:', err);
                    return res.status(500).send('Error saving session');
                }
                // Render the updated cart
                res.redirect('/cart');
            });


        } else {
            let cart = await Cart.findOne({ userId: req.user._id });

            // Check if there is available in stock.
            if (cart) {
                let productInCart = {};

                const product = await Product.findOne({ _id: productId });

                cart.items.forEach(item => {
                    if (item.productId == productId) {
                        productInCart = item;
                    }
                });

                const amount = parseInt(productInCart.quantity) + parseInt(quantity);
                const stock = parseInt(product.stock);
                if (amount > stock) {
                    let available = stock - parseInt(productInCart.quantity);
                    if (available < 0) {
                        available = 0;
                    }
                    return res.status(500).send(`Sorry, There is no enough stock!, Available ${available}`);
                }
            }

            if (!cart) {
                cart = new Cart({ userId: req.user._id, items: [] });
            }

            // Check if product already exists in cart
            const existingItem = cart.items.find(item => item.productId == productId);

            if (existingItem) {
                existingItem.quantity += parseInt(quantity);
            } else {
                cart.items.push({ productId, quantity: parseInt(quantity) });
            }

            await cart.save();
            res.redirect('/cart');
        }
    } catch (err) {
        res.status(500).send('Error adding product to cart');
    }
};

exports.setCart = async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        if (!req.user) {
            const cartItemIndex = req.session.cart.findIndex(item => item.productId === productId);
            if (quantity >= 0) {
                req.session.cart[cartItemIndex].quantity = quantity;

            } else {
                req.session.cart = (req.session.cart || []).filter(item => item.productId !== productId);
            }
            const cart = req.session.cart;
            res.json({ success: true, cart });

        } else {
            // Find the user's cart
            const cart = await Cart.findOne({ userId: req.user._id });
            if (cart) {
                let productInCart = {};

                const product = await Product.findOne({ _id: productId });
                cart.items.forEach(item => {
                    if (item.productId == productId) {
                        productInCart = item;
                    }
                });

                const stock = parseInt(product.stock);

                if (parseInt(quantity) > stock) {
                    let available = stock - parseInt(quantity);
                    if (available < 0) {
                        available = 0;
                    }
                    return res.status(400).json({ message: `Sorry, There is no enough stock! Available ${stock}` });
                }
            }

            if (!cart) return res.status(404).json({ message: 'Cart not found' });

            // Find the item in the cart
            const item = cart.items.find(i => i.productId.toString() === productId);
            if (!item) return res.status(404).json({ message: 'Item not found in cart' });

            // Update quantity based on action
            if (quantity) {
                item.quantity = quantity;
            } else {
                // Optionally handle removal if quantity is 1 and action is 'subtract'
                cart.items = cart.items.filter(i => i.productId.toString() !== productId);
            }

            await cart.save();
            res.json({ success: true, cart });
        }


    } catch (error) {
        console.error('Error updating cart quantity:', error);
        res.status(500).json({ message: 'Error updating cart' });
    }
}

exports.updateCart = async (req, res) => {
    const { productId, action } = req.body;
    try {
        if (!req.user) {
            const cartItemIndex = req.session.cart.findIndex(item => item.productId === productId);
            if (action === 'add') {
                req.session.cart[cartItemIndex].quantity += 1;

            } else if (action === 'subtract' && req.session.cart[cartItemIndex].quantity > 1) {
                req.session.cart[cartItemIndex].quantity -= 1;
            } else {
                req.session.cart = (req.session.cart || []).filter(item => item.productId !== productId);
            }
            const cart = req.session.cart;
            res.json({ success: true, cart });

        } else {
            // Find the user's cart
            const cart = await Cart.findOne({ userId: req.user._id });
            if (cart) {
                let productInCart = {};

                const product = await Product.findOne({ _id: productId });
                cart.items.forEach(item => {
                    if (item.productId == productId) {
                        productInCart = item;
                    }
                });
                const amount = parseInt(productInCart.quantity);
                const stock = parseInt(product.stock);
                if (amount >= stock && action === 'add') {
                    let available = stock - parseInt(productInCart.quantity);
                    if (available < 0) {
                        available = 0;
                    }
                    return res.status(500).send(`Sorry, There is no enough stock!, Available ${available}`);
                }
            }

            if (!cart) return res.status(404).json({ message: 'Cart not found' });

            // Find the item in the cart
            const item = cart.items.find(i => i.productId.toString() === productId);
            if (!item) return res.status(404).json({ message: 'Item not found in cart' });

            // Update quantity based on action
            if (action === 'add') {
                item.quantity += 1;
            } else if (action === 'subtract' && item.quantity > 1) {
                item.quantity -= 1;
            } else {
                // Optionally handle removal if quantity is 1 and action is 'subtract'
                cart.items = cart.items.filter(i => i.productId.toString() !== productId);
            }

            await cart.save();
            res.json({ success: true, cart });
        }


    } catch (error) {
        console.error('Error updating cart quantity:', error);
        res.status(500).json({ message: 'Error updating cart' });
    }
}

// Remove item from cart
exports.removeCart = async (req, res) => {
    const { productId } = req.body;

    try {
        if (!req.user) {
            req.session.cart = (req.session.cart || []).filter(item => item.productId !== productId);
        } else {
            let cart = await Cart.findOne({ userId: req.user._id });

            cart.items = cart.items.filter(item => item.productId != productId);

            await cart.save();
        }
        res.redirect('/cart');
    } catch (err) {
        res.status(500).send('Error removing item from cart');
    }
};


