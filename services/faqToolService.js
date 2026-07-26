const FAQ = require("../models/FAQ");

exports.execute = async (tenant, message) => {

    const faq = await FAQ.findOne({

        tenantId: tenant._id,

        question: new RegExp(message, "i")

    }).lean();

    if (!faq) {

        return {
            handled: false,
            response: null
        };

    }

    return {

        handled: true,

        response: faq.answer

    };

};