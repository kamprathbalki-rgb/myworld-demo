const TenantKnowledge = require("../models/TenantKnowledge");

exports.search = async (tenantId, message) => {

    const items = await TenantKnowledge.find({
        tenantId
    }).lean();

    if (!items.length) {
        return null;
    }

    const text = message.toLowerCase();

    for (const item of items) {

        const content =
            JSON.stringify(item).toLowerCase();

        if (content.includes(text)) {
            return item;
        }

    }

    return null;

};