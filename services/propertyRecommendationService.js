const Property = require("../models/Property");

exports.recommend = async (tenantId, limit = 5) => {

    return await Property.find({
        tenantId,
        active: true
    })
    .sort({
        createdAt: -1
    })
    .limit(limit)
    .lean();

};