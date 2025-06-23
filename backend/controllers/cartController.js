// routes/cartRoutes.js
const express = require('express');
const Cart = require('../models/Cart');
const User = require('../Models/User');
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

async function cartItemWithSelectedVariant(cart, products) {
    const detailedCart = [];

    for (const cartItem of cart.items) {
        // ✅ Safely skip if productId is null
        if (!cartItem.productId || !cartItem.productId._id) continue;

        const product = products.find(p => p._id.equals(cartItem.productId._id));
        if (!product) continue;

        let variantData = null;

        // ✅ Normalize and match variant
        if (cartItem.attributes && product.variants?.length > 0) {
            const normalizedVariants = product.variants.map(variant => {
                const normalizedAttrs = variant.attributes instanceof Map
                    ? Object.fromEntries(variant.attributes)
                    : variant.attributes;

                return {
                    ...(variant.toObject?.() ?? variant),
                    attributes: normalizedAttrs
                };
            });

            const normalizedCartAttrs = cartItem.attributes instanceof Map
                ? Object.fromEntries(cartItem.attributes)
                : cartItem.attributes;

            variantData = normalizedVariants.find(variant =>
                Object.entries(normalizedCartAttrs).every(
                    ([key, value]) => variant.attributes?.[key] === value
                )
            ) || null;
        }

        const variantAttrs = variantData?.attributes || {};
        const image = variantData?.image || product.image;
        const price = variantData?.price || product.price;
        const stock = variantData?.stock || product.stock;

        // ✅ Check if same product+attributes exists already
        const existingIndex = detailedCart.findIndex(item =>
            item._id.equals(product._id) &&
            JSON.stringify(item.attributes || {}) === JSON.stringify(variantAttrs)
        );

        if (existingIndex !== -1) {
            detailedCart[existingIndex].quantity += cartItem.quantity;
        } else {
            detailedCart.push({
                ...product.toObject(),
                quantity: cartItem.quantity,
                attributes: variantAttrs,
                variants: [],
                image,
                price,
                stock,
            });
        }
    }

    return detailedCart;
}

// Normalize attributes (Map → Object)
const normalizeAttributes = (attrs) => {
    if (!attrs) return {};
    if (attrs instanceof Map) return Object.fromEntries(attrs);
    if (typeof attrs.toObject === 'function') return attrs.toObject();
    return { ...attrs };
};

const isSameAttributes = (a, b) => {
    const normA = normalizeAttributes(a);
    const normB = normalizeAttributes(b);

    const keysA = Object.keys(normA);
    const keysB = Object.keys(normB);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(key => normA[key]?.trim?.() === normB[key]?.trim?.());
};

// GET cart details for logged-in user
exports.getCart = async (req, res) => {
    try {
        if (!req.user) {
            if (!req.session.cart || req.session.cart.length === 0) {
                return res.json({ cart: [], user: null, currency: req.currency });
            }

            const productIds = req.session.cart.map(item => item.productId);
            const products = await Product.find({ _id: { $in: productIds } }).populate('category');

            const detailedCart = [];

            for (const cartItem of req.session.cart) {
                const product = products.find(p => p._id.toString() === cartItem.productId);
                if (!product) continue;

                let variantData = null;

                if (cartItem.attributes && product.variants?.length > 0) {
                    const normalizedVariants = product.variants.map(variant => {
                        const normalizedAttrs = variant.attributes instanceof Map
                            ? Object.fromEntries(variant.attributes)
                            : variant.attributes;

                        return {
                            ...variant.toObject?.() ?? variant,
                            attributes: normalizedAttrs
                        };
                    });

                    variantData = normalizedVariants.find(variant =>
                        Object.entries(cartItem.attributes).every(
                            ([key, value]) => variant.attributes?.[key] === value
                        )
                    ) || null;
                }

                const variantAttrs = variantData?.attributes || {};
                const image = variantData?.image || product.image;
                const price = variantData?.price || product.price;
                const stock = variantData?.stock || product.stock;

                // Merge quantities if same product + attributes exists already
                const existingIndex = detailedCart.findIndex(item =>
                    item._id.toString() === product._id.toString() &&
                    JSON.stringify(item.attributes || {}) === JSON.stringify(variantAttrs)
                );

                if (existingIndex !== -1) {
                    detailedCart[existingIndex].quantity += cartItem.quantity;
                } else {
                    detailedCart.push({
                        ...product.toObject(),
                        quantity: cartItem.quantity,
                        attributes: variantAttrs,
                        variants: [],
                        image,
                        price,
                        stock
                    });
                }
            }

            const formattedProducts = detailedCart.map(p => ({
                ...p,
                price: convertPrice(p.price, req.currency),
                currency: req.currency
            }));

            const productsWithDiscount = await applyDiscount(formattedProducts);

            res.json({ cart: productsWithDiscount, user: null, currency: req.currency });
        } else {
            const hasRole = await User.hasRole(req.user._id, ['admin', 'sales', 'manager']);
            if (hasRole)
                return res.status(403).json({ error: 'Access denied.' });

            const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
            const productIds = cart.items
                .map(item => item.productId)
                .filter(product => product !== null && product !== undefined);

            const products = await Product.find({ _id: { $in: productIds } }).populate('category');

            const detailedCart = await cartItemWithSelectedVariant(cart, products)

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
        console.log('Error retrieving cart', err);
        res.status(500).send('Error retrieving cart');
    }
};

// Add product to cart
exports.addToCart = async (req, res) => {
    let { productId, quantity = 1, attributes = {} } = req.body;

    try {
        if (!req.user) {
            // Ensure session cart is initialized
            if (!req.session.cart) req.session.cart = [];

            const product = await Product.findOne({ _id: productId });
            if (!product) return res.status(404).send('Product not found');

            const parsedQuantity = parseInt(quantity);

            if ((!attributes || Object.keys(attributes).length === 0) && product?.variants[0]?.attributes) {
                attributes = Object.fromEntries(product?.variants[0]?.attributes);
            }

            console.log(attributes);

            const existingItem = req.session.cart.find(item =>
                item.productId === productId &&
                isSameAttributes(item.attributes || {}, attributes)
            );

            // Determine total desired quantity
            const totalQuantity = existingItem
                ? existingItem.quantity + parsedQuantity
                : parsedQuantity;

            // Variant stock check
            const variant = attributes && Object.keys(attributes).length > 0
                ? product.variants?.find(v =>
                    Object.entries(attributes).every(
                        ([k, vVal]) => v.attributes?.get(k) === vVal
                    )
                )
                : null;

            const stockToCheck = variant ? variant.stock : product.stock;

            if (totalQuantity > stockToCheck) {
                const available = stockToCheck - (existingItem?.quantity || 0);
                return res.status(400).send(`Insufficient stock! Only ${available} left.`);
            }

            // Add or update item in session cart
            if (existingItem) {
                existingItem.quantity += parsedQuantity;
            } else {
                req.session.cart.push({
                    productId,
                    quantity: parsedQuantity,
                    attributes
                });
            }

            req.session.save(err => {
                if (err) {
                    console.error('Session Save Error:', err);
                    return res.status(500).send('Session Error');
                }

                res.status(200).json({ success: true });
            });

        }
        else {
            const hasRole = await User.hasRole(req.user._id, ['admin', 'sales', 'manager']);
            if (hasRole)
                return res.status(403).json({ error: 'Access denied.' });

            let cart = await Cart.findOne({ userId: req.user._id });
            if (!cart) cart = new Cart({ userId: req.user._id, items: [] });

            const product = await Product.findOne({ _id: productId });
            if (!product) return res.status(404).send('Product not found');

            if ((!attributes || Object.keys(attributes).length === 0) && product?.variants[0]?.attributes) {
                attributes = Object.fromEntries(product?.variants[0]?.attributes);
            }

            console.log(attributes);


            const existingItem = cart.items.find(item =>
                item.productId.toString() === productId &&
                isSameAttributes(item.attributes || {}, attributes)
            );

            // Stock check
            const totalQuantity = existingItem
                ? existingItem.quantity + parseInt(quantity)
                : parseInt(quantity);

            const variant =
                attributes && Object.keys(attributes).length > 0
                    ? product.variants?.find(v =>
                        Object.entries(attributes).every(
                            ([k, vVal]) => v.attributes?.get(k) === vVal
                        )
                    )
                    : null;

            const stockToCheck = variant ? variant.stock : product.stock;
            if (totalQuantity > stockToCheck) {
                const available = stockToCheck - (existingItem?.quantity || 0);
                return res.status(400).send(`Insufficient stock! Only ${available} left.`);
            }

            if (existingItem) {
                existingItem.quantity += parseInt(quantity);
            } else {
                cart.items.push({ productId, quantity: parseInt(quantity), attributes });
            }

            await cart.save();

            res.status(200).json({ success: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding product to cart');
    }
};

exports.setCart = async (req, res) => {

    const { productId, quantity, attribute = {} } = req.body;

    try {
        if (!req.user) {
            const cart = req.session.cart || [];

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            const normalizedCartAttrs = normalizeAttributes(attribute);

            const variant = product.variants?.find(variant => {
                const variantAttrs = normalizeAttributes(variant.attributes);
                return Object.entries(normalizedCartAttrs).every(
                    ([key, value]) => variantAttrs[key] === value
                );
            });

            const stockToCheck = variant ? variant.stock : product.stock;

            if (quantity > stockToCheck) {
                return res.status(400).json({ message: `Insufficient stock! Only ${stockToCheck} available.` });
            }

            const itemIndex = cart.findIndex(item =>
                item.productId === productId &&
                isSameAttributes(item.attributes, attribute)
            );

            if (itemIndex === -1) {
                return res.status(404).json({ message: 'Item not found in cart' });
            }

            if (quantity >= 1) {
                cart[itemIndex].quantity = quantity;
            } else {
                cart.splice(itemIndex, 1); // Remove item
            }

            req.session.cart = cart;
            return res.json({ success: true, cart });
        }
        // Logged-in user
        let cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const itemIndex = cart.items.findIndex(item =>
            item.productId.toString() === productId &&
            isSameAttributes(item.attributes, attribute)
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Stock check
        const normalizedCartAttrs = normalizeAttributes(attribute);

        const variant = product.variants?.find(variant => {
            const variantAttrs = normalizeAttributes(variant.attributes);
            return Object.entries(normalizedCartAttrs).every(
                ([key, value]) => variantAttrs[key] === value
            );
        });

        const stockToCheck = variant ? variant.stock : product.stock;

        if (quantity > stockToCheck) {
            return res.status(400).json({ message: `Insufficient stock! Only ${stockToCheck} available.` });
        }

        // Update or remove item
        if (quantity >= 1) {
            cart.items[itemIndex].quantity = quantity;
        } else {
            cart.items.splice(itemIndex, 1);
        }

        await cart.save();
        res.json({ success: true, cart });

    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Error updating cart' });
    }
};

exports.updateCart = async (req, res) => {
    const { productId, action, attribute } = req.body;
    try {
        const normalizedAttr = normalizeAttributes(attribute);

        if (!req.user) {
            req.session.cart = req.session.cart || [];
            const product = await Product.findById(productId);
            const itemIndex = req.session.cart.findIndex(item =>
                item.productId === productId && isSameAttributes(item.attributes, normalizedAttr)
            );

            if (itemIndex === -1) {
                return res.status(404).json({ message: 'Item not found in cart' });
            }

            const normalizedCartAttrs = normalizeAttributes(attribute);

            const variant = product.variants?.find(variant => {
                const variantAttrs = normalizeAttributes(variant.attributes);
                return Object.entries(normalizedCartAttrs).every(
                    ([key, value]) => variantAttrs[key] === value
                );
            });

            const stock = variant ? variant.stock : product.stock;
            const cartItem = req.session.cart[itemIndex];
            const currentQty = cartItem.quantity;

            if (action === 'add') {
                if (currentQty >= stock) {
                    return res.status(400).json({ message: `Insufficient stock! Only ${stock} available.` });
                }
                req.session.cart[itemIndex].quantity += 1;
            } else if (action === 'subtract' && req.session.cart[itemIndex].quantity > 1) {
                req.session.cart[itemIndex].quantity -= 1;
            } else {
                req.session.cart.splice(itemIndex, 1);
            }

            return res.json({ success: true, cart: req.session.cart });
        }

        // Logged-in user
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });


        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const itemIndex = cart.items.findIndex(item =>
            item.productId.toString() === productId && isSameAttributes(item.attributes, normalizedAttr)
        );


        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Stock check
        const normalizedCartAttrs = normalizeAttributes(attribute);

        const variant = product.variants?.find(variant => {
            const variantAttrs = normalizeAttributes(variant.attributes);
            return Object.entries(normalizedCartAttrs).every(
                ([key, value]) => variantAttrs[key] === value
            );
        });

        const stock = variant ? variant.stock : product.stock;
        const cartItem = cart.items[itemIndex];
        const currentQty = cartItem.quantity;

        if (action === 'add') {
            if (currentQty >= stock) {
                return res.status(400).json({ message: `Sorry, not enough stock! Available: ${stock}` });
            }
            cartItem.quantity += 1;
        } else if (action === 'subtract' && currentQty > 1) {
            cartItem.quantity -= 1;
        } else {
            cart.items.splice(itemIndex, 1);
        }

        await cart.save();
        res.json({ success: true, cart });

    } catch (error) {
        console.error('Error updating cart quantity:', error);
        res.status(500).json({ message: 'Error updating cart' });
    }
};

exports.removeCart = async (req, res) => {
    const { productId, attribute } = req.body;

    try {
        if (!req.user) {
            req.session.cart = (req.session.cart || []).filter(item =>
                item.productId !== productId || attribute ? !isSameAttributes(item.attributes, attribute) : false
            );
        } else {
            const cart = await Cart.findOne({ userId: req.user._id });
            if (cart) {
                if (attribute) {
                    cart.items = cart.items.filter(item =>
                        item.productId.toString() !== productId || !isSameAttributes(item.attributes, attribute)
                    );
                } else {
                    cart.items = cart.items.filter(item =>
                        item.productId.toString() !== productId
                    );
                }

                await cart.save();
            }
        }
        res.redirect('/cart');
    } catch (err) {
        console.error('Remove Cart Error:', err);
        res.status(500).send('Error removing item from cart');
    }
};



