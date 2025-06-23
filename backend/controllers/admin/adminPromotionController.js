const Promotion = require('../../models/Promotion');
const User = require('../../Models/User');
const { notifyUser } = require('../../utils/notifyUser');
const logger = require('../../utils/logger.js');

exports.managePromotion = async (req, res) => {
    const promotions = await Promotion.find().populate('product');
    res.json({ promotions })
}

exports.addPromotionPost = async (req, res) => {
    try {
        const {
            name,
            type,
            code,
            productId,
            discountPercentage,
            startDate,
            endDate
        } = req.body;

        // Validate required fields
        if (!name || !type || !productId || !discountPercentage || !startDate || !endDate) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Construct base promotion object
        const promotionData = {
            name,
            type,
            product: productId,
            discountPercentage,
            startDate,
            endDate,
        };

        // Only add code if type is "code" or "hybrid"
        if (type === "code" || type === "hybrid") {
            if (!code) {
                return res.status(400).json({ error: "Promo code is required for code or hybrid promotions" });
            }
            promotionData.code = code;
        }

        const promotion = new Promotion(promotionData);

        await promotion.save();

        res.status(201).json({ promotion });

        // Notify users in background
        setImmediate(async () => {
            try {
                const users = await User.getUsersWithRole('customer'); // or adjust as needed

                await Promise.all(
                    users.map(user =>
                        notifyUser({
                            username: user.username,
                            userId: user._id,
                            type: 'promo',
                            title: `Special Offer: ${promotion.name}`,
                            message: `A new promotion "${promotion.name}" is now available! Check out the product for a limited-time offer.`,
                            meta: {
                                email: user.email,
                                phone: (user.phone || '').toString(),
                                productId,
                                link: `/products/${productId}`,
                            },
                        })
                    )
                );
                logger.info(`📢 New promotion "${promotion.name}" added by ${req.user.username}`);
                logger.info(`📣 Promotion "${promotion.name}" sent to ${users.length} customers by ${req.user.username}`);
            } catch (notifyError) {
                logger.error("❌ Failed to log:", notifyError);
            }
        });
    } catch (error) {
        logger.error("❌ Error creating promotion:", error);
        res.status(500).json({ error: "Server error" });
    }
}

exports.updatePromotion = async (req, res) => {
    const promotion = await Promotion.findById(req.params.id);
    res.json({ promotion });
}

exports.updatePromotionPost = async (req, res) => {
    try {
        const { name, code, productId, discountPercentage, startDate, endDate, type } = req.body;

        const promotion = await Promotion.findByIdAndUpdate(req.params.id, {
            name,
            code,
            product: productId,
            discountPercentage,
            startDate,
            endDate,
            type,
        });

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found." });
        }

        res.json({ promotion });

        setImmediate(async () => {
            try {
                logger.info(`📢 Promotion "${promotion.name}" updated by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log:", error);
            }
        });
    } catch (error) {
        logger.error("❌ Error updating promotion:", error);
    }
}

exports.deletePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndDelete(req.params.id);
        res.json({ promotion });

        setImmediate(async () => {
            try {
                logger.info(`📢 Promotion "${promotion.name}" deleted by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log", error);
            }
        });
    } catch (error) {
        logger.error("❌ Error to delete promotion:", error);
    }
}

