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
    query.projectStatus = lead.projectStatus;
}

if (lead.possessionStatus) {
    query.possessionStatus = lead.possessionStatus;
}

if (lead.transactionType) {
    query.transactionType = lead.transactionType;
}

    if (lead.location) {
        query.$or = [
            {
                city: {
                    $regex: lead.location,
                    $options: "i"
                }
            },
            {
                propertyLocation: {
                    $regex: lead.location,
                    $options: "i"
                }
            }
        ];
    }

if (lead.configuration) {

    query.configurations = {
        $elemMatch: {
            flatType: lead.configuration,

            ...(budget !== null && {
                quotedPrice: {
                    $lte: budget + 5
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

const properties = await Property.find(query).lean();

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

if (
    budget !== null &&
    Number(config.quotedPrice) > budget + 5
)
    return false;

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