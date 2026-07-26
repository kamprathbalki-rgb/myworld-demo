const Property = require("../models/Property");

exports.search = async (tenantId, lead = {}) => {

    const query = {
        tenantId,
        propertyStatus: "Available"
    };

    if (lead.propertyCategory) {
        query.projectType = lead.propertyCategory;
    }

    if (lead.propertyType) {
        query.propertyType = lead.propertyType;
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
                ...(lead.budget && {
                    quotedPrice: {
                        $lte: Number(lead.budget)
                    }
                }),
                ...(lead.carpetArea && {
                    carpetArea: Number(lead.carpetArea)
                })
            }
        };
    }

console.log("\n========== PROPERTY SEARCH QUERY ==========");
console.dir(query, { depth: null });
console.log("===========================================");

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
                lead.budget &&
                Number(config.quotedPrice) > Number(lead.budget)
            )
                return false;

            if (
                lead.carpetArea &&
                Number(config.carpetArea) !== Number(lead.carpetArea)
            )
                return false;

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