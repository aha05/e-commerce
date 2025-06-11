const Promotion = require('../../models/Promotion');

exports.managePromotion = async (req, res) => {
    const promotions = await Promotion.find().populate('product');

    res.json({ promotions })
}

exports.addPromotion = (req, res) => {

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
    } catch (error) {
        console.error("Error creating promotion:", error);
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
    } catch (error) {
        console.error(error);
    }
}

exports.deletePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndDelete(req.params.id);
        res.json({ promotion });
    } catch (error) {
        console.error(error);
    }
}

