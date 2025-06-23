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

async function applyDiscountWithCode(products) {
    const now = new Date();
    const codePromotions = await Promotion.find({
        code: code,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
    });

    // handle both single and multiple products
    products = !Array.isArray(products) ? [products] : products;

    // Apply matching promotion to each product
    const productsWithDiscount = products.map(product => {
        const promo = codePromotions.find(p => p.product.toString() === product._id.toString());

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

async function cartItemWithSelectedVariant(cart, products) {
    const detailedCart = [];

    for (const cartItem of cart.items) {
        const product = products.find(p => p._id.equals(cartItem.productId._id));
        if (!product) continue;

        let variantData = null;

        // Normalize variants and cart attributes
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

        // Check if same product + same attributes already in detailedCart
        const existingIndex = detailedCart.findIndex(item =>
            item._id.equals(product._id) &&
            JSON.stringify(item.attributes || {}) === JSON.stringify(variantAttrs)
        );

        if (existingIndex !== -1) {
            // Update quantity if the same variant exists
            detailedCart[existingIndex].quantity += cartItem.quantity;
        } else {
            // Add new cart item
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

async function orderItemWithSelectedVariant(order, products) {
    const orderItems = [];

    for (const orderItem of order.items) {
        const product = products.find(p => p._id.equals(orderItem.productId._id));
        if (!product) continue;

        let variantData = null;

        // Normalize and match variant
        if (orderItem.attributes && product.variants?.length > 0) {
            const normalizedVariants = product.variants.map(variant => {
                const normalizedAttrs = variant.attributes instanceof Map
                    ? Object.fromEntries(variant.attributes)
                    : variant.attributes;
                return {
                    ...variant.toObject?.() ?? variant,
                    attributes: normalizedAttrs
                };
            });

            const normalizedCartAttrs = orderItem.attributes instanceof Map
                ? Object.fromEntries(orderItem.attributes)
                : orderItem.attributes;

            variantData = normalizedVariants.find(variant =>
                Object.entries(normalizedCartAttrs).every(
                    ([key, value]) => variant.attributes?.[key] === value
                )
            ) || null;
        }

        orderItems.push({
            productId: {
                ...product.toObject(),
                price: variantData?.price || product?.price,
                stock: variantData?.stock || product?.stock,
                image: variantData?.image || product?.image,
                attributes: variantData?.attributes || product?.attributes,
                variants: []
            },
            quantity: orderItem.quantity,
            attributes: orderItem.attributes,
            discountAmount: orderItem.discountAmount,
            discountPrice: orderItem.discountPrice,
            _id: orderItem._id
        });
    }



    return orderItems;
}

async function updateStockAndSendNotifications(itemList) {
    for (const item of itemList) {
        const product = await Product.findById(item.productId);

        if (!product) continue;

        // If product has variants
        if (product.variants && product.variants.length > 0 && item.attributes) {
            const variant = product.variants.find(v => {
                const attrs = v.attributes instanceof Map
                    ? Object.fromEntries(v.attributes)
                    : v.attributes;

                const itemAttrs = item.attributes instanceof Map
                    ? Object.fromEntries(item.attributes)
                    : item.attributes;

                return Object.keys(itemAttrs).every(key => itemAttrs[key] === attrs?.[key]);
            });

            if (variant) {
                // Decrement variant stock
                variant.stock = (variant.stock || 0) - item.quantity;

                // Trigger alert if stock low
                if (variant.stock < 5) {
                    const adminUser = await User.getAdminUser?.();
                    if (adminUser) {
                        await notifyUser({
                            userId: adminUser._id,
                            type: 'order',
                            title: 'Low Stock Alert',
                            message: `Stock for variant of "${product.name}" is low.`,
                            meta: {
                                email: adminUser.email,
                                phone: adminUser.phone || '',
                                productId: product._id,
                                link: `/admin/products`,
                            },
                        });
                    }
                }
            }
        } else {
            // Fallback to product-level stock
            const updatedProduct = await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } },
                { new: true }
            );

            if (updatedProduct?.stock < 5) {
                const adminUser = await User.getAdminUser?.();
                if (adminUser) {
                    await notifyUser({
                        userId: adminUser._id,
                        type: 'order',
                        title: 'Low Stock Alert',
                        message: `Stock for product "${updatedProduct.name}" is low.`,
                        meta: {
                            email: adminUser.email,
                            phone: adminUser.phone || '',
                            productId: updatedProduct._id,
                            link: `/admin/products/${updatedProduct._id}`,
                        },
                    });
                }
            }
        }

        await product.save(); // Save variant stock change if any
    }
}

exports.getCheckoutPage = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized!" });
        } else {
            const hasRole = await User.hasRole(req.user._id, ['admin', 'sales', 'manager']);
            if (hasRole)
                return res.status(403).json({ error: 'Access denied.' });

            const user = await User.findById(req.user._id);
            const userId = req.user._id;

            // Retrieve the cart for the user from the database
            const cart = await Cart.findOne({ userId }).populate('items.productId'); // `populate` will load product details
            const productIds = cart.items.map(items => items.productId);

            const products = await Product.find({ _id: { $in: productIds } }).populate('category');

            const detailedCart = await cartItemWithSelectedVariant(cart, products)

            if (!cart || cart?.items?.length === 0) {
                res.status(404).json({ message: "Cart is empty" });
                return;
            }

            const formattedProducts = detailedCart.map(p => ({
                ...p,
                price: convertPrice(p.price, req.currency),
                currency: req.currency
            }));

            const productsWithDiscount = await applyDiscount(formattedProducts);


            res.json({ user, cart: productsWithDiscount });
        }
    } catch (error) {
        console.error("Failed to load checkout page:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.postOrder = async (req, res) => {
    try {
        if (!req.user) return res.status(401).send('Invalid user!');

        const hasRole = await User.hasRole(req.user._id, ['admin', 'sales', 'manager']);
        if (hasRole)
            return res.status(403).json({ error: 'Access denied.' });

        const { shippingAddress, paymentMethod, code } = req.body;
        const userId = req.user._id;

        if (!shippingAddress || !paymentMethod) {
            return res.status(400).json({ error: 'Missing required Fields!' });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId'); // `populate` will load product details
        const productIds = cart.items.map(items => items.productId);

        const products = await Product.find({ _id: { $in: productIds } }).populate('category');

        const detailedCart = await cartItemWithSelectedVariant(cart, products);


        if (!cart || !detailedCart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty or invalid' });
        }

        const now = new Date();
        const promotions = await Promotion.find({
            isActive: true,
            $or: [
                { type: 'auto', startDate: { $lte: now }, endDate: { $gte: now } },
                { type: 'code', code: code, startDate: { $lte: now }, endDate: { $gte: now } }
            ]
        });

        let discountTotal = 0;
        let itemList = [];

        for (const item of detailedCart) {
            const product = item;

            const quantity = item.quantity;
            const attributes = item.attributes;

            const promotion = promotions.find(p => p.product.toString() === product?._id?.toString());
            const discountPercentage = promotion ? promotion.discountPercentage : 0;
            const discountAmount = ((product.price * discountPercentage) / 100).toFixed(2);
            const discountPrice = (product.price - discountAmount).toFixed(2);

            discountTotal += discountAmount * quantity;

            itemList.push({
                productId: product._id,
                quantity,
                attributes,
                discountAmount: Number(discountAmount),
                discountPrice: Number(discountPrice)
            });
        }


        const orderTotal = itemList.reduce((sum, item) => sum + (item.discountPrice * item.quantity), 0).toFixed(2);

        const orderNumber = 'ORD' + Date.now();

        const order = new Order({
            userId,
            items: itemList,
            shippingAddress,
            paymentMethod,
            discountCode: code || '',
            discountValue: promotions.find(p => p.code === code)?.discountPercentage || 0,
            discountTotal: Number(discountTotal.toFixed(2)),
            orderTotal: Number(orderTotal),
            orderNumber
        });



        await order.save();

        // Decrease stock and notify if low

        await updateStockAndSendNotifications(itemList);

        // Clear cart after order
        await Cart.findOneAndUpdate({ userId }, { items: [] });

        res.json({ success: true, orderNumber });

        setImmediate(async () => {
            try {
                await Promise.all(
                    notifyUser({
                        username: req.user.username,
                        userId: req.user._id,
                        type: 'order',
                        title: `#${order.orderNumber} Confirmed`,
                        message: `Hi ${req.user.name}, your order has been placed successfully. Thank you for shopping with us!`,
                        meta: {
                            email: req.user.email,
                            phone: (req.user.phone || '').toString(),
                            productIds,
                            link: `/profile`, // removed extra closing brace
                        }
                    })
                );
                console.log(`📣 Order confirmation notification sent to ${req.user.name}`);
            } catch (notifyError) {
                console.error("❌ Failed to notify user:", notifyError);
            }
        });


    } catch (error) {
        console.error('Order placement failed:', error);
        res.status(500).send('Order placement failed');
    }
};

exports.getOrderConfirmation = async (req, res) => {
    if (!req.user) {
        res.status(401).send('Invalid User!');
    } else {
        const userId = req.user._id;
        const orderNumber = req.query.orderNumber;
        const order = await Order.findOne({ orderNumber }).populate('items.productId');


        const productIds = order.items.map(items => items.productId);

        const products = await Product.find({ _id: { $in: productIds } }).populate('category');

        const detailedOrder = await orderItemWithSelectedVariant(order, products)



        if (!order || detailedOrder?.length === 0) {
            res.status(404).json({ message: "Cart is empty" });
            return;
        }

        const formattedProducts = detailedOrder.map(p => ({
            ...p.productId,
            price: convertPrice(p.productId.price, req.currency),
            currency: req.currency
        }));



        const productsWithDiscount = await applyDiscount(formattedProducts);

        const updatedItems = detailedOrder.map(item => {

            const discountedProduct = productsWithDiscount.find(
                p => p._id.toString() === item.productId._id.toString() &&
                    JSON.stringify(p.attributes) === JSON.stringify(item.productId.attributes)
            );

            return {
                ...item,
                discountPrice: convertPrice(item.discountPrice, req.currency),
                discountAmount: convertPrice(item.discountAmount, req.currency),
                productId: discountedProduct,
                quantity: item.quantity,
                _id: item._id
            };
        });

        const updatedOrder = {
            ...order.toObject(),
            items: updatedItems,
            discountTotal: convertPrice(order.discountTotal, req.currency),
            orderTotal: convertPrice(order.orderTotal, req.currency),
            currency: req.currency
        };

        if (!order) return res.status(404).send("Order not found");
        res.json({ order: updatedOrder, user: req.user });
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


exports.refund = async (req, res) => {
    const { orderId, refunds } = req.body;

    if (!orderId || !Array.isArray(refunds) || refunds.length === 0) {
        return res.status(400).json({ message: 'Invalid refund data.' });
    }

    try {
        const order = await Order.findById(orderId).populate('items.productId');
        if (!order) return res.status(404).json({ message: 'Order not found.' });

        // Optional: prevent full refund if already refunded
        if (order.refund?.isRefunded) {
            return res.status(400).json({ message: 'This order has already been refunded.' });
        }

        // Build a Set of already refunded productIds
        const alreadyRefundedIds = new Set(
            order.refund?.refundedItems?.map(item => item.productId.toString()) || []
        );

        const refundedItems = [];
        let totalRefundedAmount = 0;

        for (const refund of refunds) {
            const { productId, quantity, reason } = refund;

            if (!productId || !reason || !quantity || quantity <= 0) continue;

            // 🛑 Check if this product was already refunded
            if (alreadyRefundedIds.has(productId)) {
                console.log('already been requested');
                return res.status(400).json({
                    message: `Refund has already been requested.`
                });
            }

            const orderedItem = order.items.find(
                i => i.productId._id.toString() === productId
            );

            if (!orderedItem || orderedItem.quantity < quantity) {
                return res.status(400).json({
                    message: `Invalid refund quantity for product ${productId}`
                });
            }

            const unitPrice = orderedItem.discountPrice || 0;
            totalRefundedAmount += unitPrice * quantity;

            refundedItems.push({
                productId,
                quantity,
                reason
            });
        }

        if (refundedItems.length === 0) {
            return res.status(400).json({ message: 'No valid refund items provided.' });
        }

        // Merge previous + new refund items
        const existingItems = order.refund?.refundedItems || [];

        order.refund = {
            ...order.refund,
            refundedItems: [...existingItems, ...refundedItems],
            refundedAmount: (order.refund?.refundedAmount || 0) + totalRefundedAmount,
            requestedAt: new Date() // Optionally keep earliest if already exists
        };

        await order.save();


        res.json({ message: 'Refund request submitted successfully.' });
    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({ message: 'Server error processing refund.' });
    }
};

