const express = require('express');
const passport = require('passport');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const User = require('../Models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { notifyUser } = require('../utils/notifyUser');
const { convertPrice } = require('../utils/currencyConverter');
const UserSettings = require('../models/UserSettings');



async function Reviews() {
    try {
        // Get products with at least one review
        const productsWithReviews = await Product.find({ 'reviews.0': { $exists: true } })
            .select('reviews')
            .lean();

        const allReviews = [];

        for (const product of productsWithReviews) {
            for (const review of product.reviews) {
                allReviews.push({
                    userId: review.user,
                    rating: review.rating,
                    text: review.comment,
                    createdAt: review.createdAt
                });
            }
        }

        // Sort by rating DESC, then createdAt DESC
        allReviews.sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Limit to top 5
        const topReviews = allReviews.slice(0, 5);

        // Populate user info
        const formatted = await Promise.all(topReviews.map(async (rev) => {
            const user = await User.findById(rev.userId).select('name image').lean();
            return {
                text: rev.text || '',
                name: user?.name || 'Anonymous',
                image: user?.image || 'https://via.placeholder.com/50',
                rating: rev.rating
            };
        }));

        return formatted;
    } catch (err) {
        console.error('Error fetching sorted reviews:', err);
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
}

async function applyDiscount(products) {
    const now = new Date();
    const autoPromotions = await Promotion.find({
        type: 'auto',
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
    });

    // Handle both single and multiple products
    const isSingle = !Array.isArray(products);
    products = isSingle ? [products] : products;

    const productsWithDiscount = products.map(product => {
        const promo = autoPromotions.find(p => p.product.toString() === product._id.toString());

        const discountPercentage = promo ? promo.discountPercentage : 0;

        // Helper to apply discount
        const applyDiscountToPrice = (price) =>
            promo ? price - (price * discountPercentage) / 100 : price;

        // Apply discount to product price
        const discountedProductPrice = applyDiscountToPrice(product.price);

        // Apply discount to each variant, if any
        const discountedVariants = product.variants?.map(variant => ({
            ...variant,
            price: applyDiscountToPrice(variant.price),
        })) || [];

        return {
            ...product,
            price: discountedProductPrice,
            discountPercentage,
            variants: discountedVariants,
        };
    });

    return isSingle ? productsWithDiscount[0] : productsWithDiscount;
}

exports.getIndex = async (req, res) => {
    try {
        const products = await Product.find().populate('category');

        const categories = await Category.find();
        const promotions = await Promotion.find().populate('product');
        const cart = req.session.cart || []; // Default to empty array if undefined
        const user = req.user || null;
        const reviews = await Reviews();
        // set currency

        const formattedProducts = products.map(p => ({
            ...p.toObject(),
            price: convertPrice(p.price, req.currency),
            currency: req.currency
        }));

        const productsWithDiscount = await applyDiscount(formattedProducts);

        res.json({ products: productsWithDiscount, categories, promotions, cart, user, reviews });
    } catch (error) {
        console.error('Error loading home page:', error);
        res.status(500).send('Server Error');
    }
};

exports.getPromotion = async (req, res) => {
    try {
        const now = new Date();
        const promotion = await Promotion.findOne({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            type: ['code', 'hybrid']
        })
            .sort({ createdAt: -1 })
            .populate('product');

        if (!promotion || !promotion.product) {
            return res.status(404).json({ message: "No active promotion found" });
        }

        const product = promotion.product;
        const discountAmount = (product.price * promotion.discountPercentage) / 100;
        const discount = product.price - discountAmount;

        const updatedPromotion = {
            ...promotion.toObject(),
            product: {
                ...product.toObject(),
                discountPrice: parseFloat(discount.toFixed(2)),
            }
        };

        res.json({ promotion: updatedPromotion });
    } catch (error) {
        console.error('Error retrieving Promotion', error);
        res.status(500).send('Server Error');
    }

};

exports.getAllPromotions = async (req, res) => {
    const promotions = await Promotion.find().sort({ createdAt: -1 }).populate('product');;

    // Map over promotions and apply discount
    const updatedPromotions = promotions.map(promo => {
        const product = promo.product;

        // Defensive check in case product is not populated
        if (!product) return promo;

        const discountAmount = (product.price * promo.discountPercentage) / 100;
        const discount = product.price - discountAmount;

        // Clone promotion and include final price in product
        return {
            ...promo.toObject(),
            product: {
                ...product.toObject(),
                discountPrice: parseFloat(discount.toFixed(2)), // round if needed
            }
        };
    });

    res.json({ promotions: updatedPromotions });
}



exports.getTest = async (req, res) => {
    const users = await User.getUsersWithRole('all');

    const notifications = await Promise.all(
        users.map(user =>
            notifyUser({
                username: user.username,
                userId: user._id,
                type: 'test',
                title: 'Test notification',
                message: `Test notification`,
                meta: {
                    email: user.email,
                    phone: (user.phone).toString() || '',
                    productId: "test",
                    link: '#',
                },
            })
        )
    );

    res.json(users);

};




