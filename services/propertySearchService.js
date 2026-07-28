const Property = require("../models/Property");
const normalizeBudget = require("../utils/budgetNormalizer");


exports.search = async (tenantId, lead = {}) => {

const budget = normalizeBudget(lead.budget);

    const query = {
        tenantId,
        propertyStatus: "Available"
    };

    if (lead.propertyCategory) {
        query.projectType = lead.propertyCategory;
    }

if (lead.propertyType) {
    query.propertyType = {
        $regex: `^${lead.propertyType}$`,
        $options: "i"
    };
}

if (lead.projectStatus) {

    if (Array.isArray(lead.projectStatus)) {

        if (lead.projectStatus.length > 0) {

            query.projectStatus = {
                $in: lead.projectStatus
            };

        }

    } else {

        query.projectStatus = lead.projectStatus;

    }

}

if (lead.possessionStatus) {
    query.possessionStatus = lead.possessionStatus;
}

if (lead.transactionType) {
    query.transactionType = lead.transactionType;
}

if (lead.location) {

    const locations = lead.location
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    query.$or = [];

locations.forEach(location => {

    const normalizedLocation = location
        .replace(/\b(B\.?\s*O\.?|S\.?\s*O\.?|H\.?\s*O\.?)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

    const escapedLocation = normalizedLocation.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

    query.$or.push(
        {
            city: {
                $regex: escapedLocation,
                $options: "i"
            }
        },
        {
            propertyLocation: {
                $regex: escapedLocation,
                $options: "i"
            }
        },
        {
            divisionName: {
                $regex: escapedLocation,
                $options: "i"
            }
        },
        {
            district: {
                $regex: escapedLocation,
                $options: "i"
            }
        },
        {
            stateName: {
                $regex: escapedLocation,
                $options: "i"
            }
        },
        {
            pincode: {
                $regex: escapedLocation,
                $options: "i"
            }
        }
    );

});

}

if (lead.configuration) {

    query.configurations = {
        $elemMatch: {
            flatType: lead.configuration,

...(budget !== null && {
    quotedPrice: {
        $gte: Math.floor(budget * 0.85),
        $lte: Math.ceil(budget * 1.15)
    }
}),

...(lead.carpetArea && {
    carpetArea: {
        $gte: Math.floor(Number(lead.carpetArea) * 0.90),
        $lte: Math.ceil(Number(lead.carpetArea) * 1.20)
    }
})
        }
    };

}

console.log("\n========== PROPERTY SEARCH QUERY ==========");
console.dir(query, { depth: null });
console.log("===========================================");

console.log("lead.propertyType =", lead.propertyType);
console.log("lead.projectStatus =", lead.projectStatus);
console.log("lead.transactionType =", lead.transactionType);

console.log("\n========== QUERY BEFORE FIND ==========");
console.dir(query, { depth: null });

const properties = await Property.collection.find(query).toArray();

console.log("Native Driver Count:", properties.length);

console.log("\n========== QUERY AFTER FIND ==========");
console.dir(query, { depth: null });

console.log("\n========== MATCHING PROPERTIES ==========");
console.log("Count:", properties.length);

properties.forEach((p, index) => {
    console.log({
        index: index + 1,
        project: p.projectName,
        city: p.city,
        location: p.propertyLocation,
        projectType: p.projectType,
        propertyType: p.propertyType,
        configurations: p.configurations
    });
});

console.log("=========================================");


console.log("\n========== LEAD ==========");
console.dir(lead, { depth: null });
console.log("==========================");

return properties.map(property => {

    let matchedConfiguration = null;

    if (lead.configuration) {

        matchedConfiguration = property.configurations.find(config => {

            if (config.flatType !== lead.configuration)
                return false;

if (budget !== null) {

    const minBudget = Math.floor(budget * 0.85);
    const maxBudget = Math.ceil(budget * 1.15);

    if (
        Number(config.quotedPrice) < minBudget ||
        Number(config.quotedPrice) > maxBudget
    ) {
        return false;
    }

}

if (lead.carpetArea) {

    const minArea =
        Math.floor(Number(lead.carpetArea) * 0.90);

    const maxArea =
        Math.ceil(Number(lead.carpetArea) * 1.20);

    if (
        Number(config.carpetArea) < minArea ||
        Number(config.carpetArea) > maxArea
    ) {
        return false;
    }
}

            return true;

        });

    } else {

        matchedConfiguration = property.configurations[0];

    }

    return {
        ...property,
        matchedConfiguration
    };

}).filter(property => property.matchedConfiguration);

};

exports.formatResults = (properties = []) => {

    if (!properties.length) {
        return "No matching properties found.";
    }

    return properties.map((p, index) => {

        const c = p.matchedConfiguration;

        return `${index + 1}. ${p.projectName}
Builder: ${p.builderName}
Location: ${p.propertyLocation}, ${p.city}
Type: ${p.propertyType.join(", ")}
Configuration: ${c.flatType}
Carpet Area: ${c.carpetArea}
Price: ${c.quotedPrice}
Status: ${p.propertyStatus}`;

    }).join("\n\n");
};