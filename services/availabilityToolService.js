const Property = require("../models/Property");

exports.execute = async (tenant, message) => {

    const property = await Property.findOne({
        tenantId: tenant._id,
        propertyName: new RegExp(message, "i")
    }).lean();

    if (!property) {

        return {
            handled: false,
            response: null
        };

    }

    return {

        handled: true,

        response:
`Property: ${property.propertyName}

Availability: ${property.available ? "Available" : "Not Available"}

Price: ${property.price || "N/A"}

Location: ${property.location || ""}`

    };

};