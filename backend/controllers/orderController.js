const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const User = require('../Models/User');
const Role = require('../models/Role');
const { notifyUser } = require('../utils/notifyUser');
const { convertPrice } = require('../utils/currencyConverter');


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

exports.getCheckoutPage = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized!" });

        } else {
            const userId = req.user._id;

            // Retrieve the cart for the user from the database
            const cart = await Cart.findOne({ userId }).populate('items.productId'); // `populate` will load product details

            if (!cart || cart?.items?.length === 0) {
                res.status(404).json({ message: "Cart is empty" });
                return;
            }

            const items = cart?.items?.map(item => ({
                ...item?.productId?.toObject(), // Converts Mongoose document to plain JavaScript object
                quantity: item?.quantity
            }));

            const formattedProducts = items.map(p => ({
                ...p,
                price: convertPrice(p.price, req.currency),
                currency: req.currency
            }));

            const productsWithDiscount = await applyDiscount(formattedProducts);

            res.json({ user: req.user, cart: productsWithDiscount });
        }
    } catch (error) {
        console.error("Failed to load checkout page:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.postOrder = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).send('invalid user!');
        } else {
            let { shippingAddress, paymentMethod } = req.body;

            const carts = await Cart.findOne({ userId: req.user._id }).populate('items.productId');

            const items = carts?.items?.map(item => {
                return {
                    productId: item?.productId?._id,  // Keeping only productId
                    quantity: item?.quantity
                };
            }).filter(item => item !== null);

            const userId = req.user._id

            if (!carts || !carts.items || carts?.items?.length === 0) {
                console.error("Cart is empty or invalid.");
                return;
            }

            const now = new Date();
            const promotions = await Promotion.find({
                isActive: true,
                type: 'auto', // for auto-discounts
                startDate: { $lte: now },
                endDate: { $gte: now }
            });

            const orderTotal = carts?.items?.reduce((total, item) => {
                const product = item?.productId;
                const quantity = item?.quantity;

                const promo = promotions.find(p => p.product.toString() === product._id.toString());
                const discountPercentage = promo ? promo.discountPercentage : 0;
                const discountAmount = (product.price * discountPercentage) / 100;
                const price = promo ? (product.price - discountAmount) : product.price;

                return total + (price * quantity);
            }, 0).toFixed(2);

            const orderNumber = 'ORD' + Date.now(); // Generate a unique order number

            const order = new Order({
                userId,
                items,
                shippingAddress,
                paymentMethod,
                orderTotal,
                orderNumber,
            });

            await order.save();
            for (const item of items) {
                const updatedProduct = await Product.findByIdAndUpdate(
                    item?.productId,
                    { $inc: { stock: -item.quantity } },
                    { new: true }
                );

                // Notify admin if stock is low
                if (updatedProduct.stock < 5) {
                    const adminUser = await User.getAdminUser();
                    if (adminUser) {
                        await notifyUser({
                            userId: adminUser._id,
                            type: 'order', // could also be 'promo', 'review', 'system'
                            title: 'Low Stock Alert',
                            message: `Stock for product "${updatedProduct?.name}" is low.`,
                            meta: {
                                email: adminUser.email,
                                phone: adminUser.phone || '',
                                productId: updatedProduct?._id,
                                link: `/admin/products/${updatedProduct._id}`,
                            },
                        });
                    }
                }
            }

            await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });

            res.json({
                success: true,
                orderNumber, // Send order number back
            });
        }

    } catch (error) {
        console.error('Order placement failed:', error);
        res.status(500).send('Order placement failed');
    }
}

exports.getOrderConfirmation = async (req, res) => {

    if (!req.user) {
        res.status(401).send('Invalid User!');
    } else {
        const userId = req.user._id;
        const orderNumber = req.query.orderNumber;
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const order = await Order.findOne({ orderNumber }).populate('items.productId');
        const formattedProducts = order.items.map(p => ({
            ...p.productId.toObject(),
            price: convertPrice(p.productId.price, req.currency),
            currency: req.currency
        }));

        const productsWithDiscount = await applyDiscount(formattedProducts);
        const updatedItems = order.items.map(item => {
            const discountedProduct = productsWithDiscount.find(
                p => p._id.toString() === item.productId._id.toString()
            );
            return {
                productId: discountedProduct,
                quantity: item.quantity,
                _id: item._id
            };
        });

        const updatedOrder = {
            ...order.toObject(),
            items: updatedItems,
            orderTotal: convertPrice(order.orderTotal, req.currency),
            currency: req.currency
        };

        if (!order) return res.status(404).send("Order not found");
        res.json({ order: updatedOrder, cart, user: req.user });
    }
}

exports.getOrderDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const order = await Order.findById(req.params.id).populate('items.productId'); // Populate items
        res.json({ order, cart })
    } catch (error) {
        console.error('Error loading order details:', error);
        res.status(500).send('Error loading order details');
    }
}

