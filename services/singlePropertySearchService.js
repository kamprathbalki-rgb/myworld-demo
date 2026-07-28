const Property = require("../models/Property");
const normalizeBudget = require("../utils/budgetNormalizer");

exports.search = async (tenantId, lead = {}) => {

    const budget = normalizeBudget(lead.budget);

    const query = {
        tenantId,
        propertyMode: "SINGLE",
        propertyStatus: "Available"
    };

if (lead.propertyCategory) {

    query.projectType = {
        $regex: `^${lead.propertyCategory}$`,
        $options: "i"
    };

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

        query.projectStatus = {
            $regex: `^${lead.projectStatus}$`,
            $options: "i"
        };

    }

}

if (lead.possessionStatus) {

    query.possessionStatus = {
        $regex: `^${lead.possessionStatus}$`,
        $options: "i"
    };

}

if (lead.transactionType) {

    query.transactionType = {
        $regex: `^${lead.transactionType}$`,
        $options: "i"
    };

}

if (lead.location) {

    const locations = lead.location
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    query.$or = [];

    locations.forEach(location => {

        query.$or.push(
            {
                city: {
                    $regex: location,
                    $options: "i"
                }
            },
            {
                propertyLocation: {
                    $regex: location,
                    $options: "i"
                }
            },
            {
                divisionName: {
                    $regex: location,
                    $options: "i"
                }
            },
            {
                district: {
                    $regex: location,
                    $options: "i"
                }
            },
            {
                stateName: {
                    $regex: location,
                    $options: "i"
                }
            },
            {
                pincode: {
                    $regex: location,
                    $options: "i"
                }
            }
        );

    });

}

if (lead.configuration) {

    query.singleFlatType = {
        $regex: `^${lead.configuration}$`,
        $options: "i"
    };

}

if (lead.carpetArea) {

    const carpetArea = Number(lead.carpetArea);

    if (!Number.isNaN(carpetArea) && carpetArea > 0) {

        query.singleCarpetArea = {
            $gte: Math.floor(carpetArea * 0.90),
            $lte: Math.ceil(carpetArea * 1.20)
        };

    }

}

    console.log("\n========== SINGLE PROPERTY QUERY ==========");
    console.dir(query, { depth: null });
    console.log("===========================================");

    const properties = await Property.find(query).lean();

    console.log("\n========== MATCHING SINGLE PROPERTIES ==========");
    console.log("Count:", properties.length);
    console.log("===============================================");

    const filteredProperties = properties.filter(property => {

    if (budget !== null) {

        const price = Number(property.singleQuotedPrice);

        if (
            Number.isNaN(price) ||
            price < Math.floor(budget * 0.85) ||
            price > Math.ceil(budget * 1.15)
        ) {
            return false;
        }

    }

    return true;

});

console.log("\n========== FILTERED SINGLE PROPERTIES ==========");
console.log("Count:", filteredProperties.length);
console.log("===============================================");

return filteredProperties;

};

exports.formatResults = (properties = []) => {

    if (!properties.length) {
        return "No matching single properties found.";
    }

    return properties.map((p, index) => {

        return `${index + 1}. ${p.projectName}
Owner: ${p.ownerName}
Mobile: ${p.ownerMobile}
Location: ${p.propertyLocation}, ${p.city}
Type: ${Array.isArray(p.propertyType) ? p.propertyType.join(", ") : p.propertyType}
Configuration: ${p.singleFlatType}
Carpet Area: ${p.singleCarpetArea}
Price: ${p.singleQuotedPrice}
Status: ${p.propertyStatus}`;

    }).join("\n\n");

};