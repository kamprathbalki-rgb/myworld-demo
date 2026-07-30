const Buyer = require("../models/Buyer");
const Property = require("../models/Property");
const Tenant = require("../models/Tenant");

const normalize = value =>
    String(value || "")
        .toUpperCase()
        .replace(/\b(B\.?O\.?|S\.?O\.?|H\.?O\.?|G\.?P\.?O\.?)\b/g, "")
        .replace(/[^A-Z0-9 ]/g, "")
        .replace(/\s+/g, " ")
        .trim();

async function getMarketplaceMatches(buyerId, currentTenantId) {

const buyer = await Buyer.findById(buyerId);

if (!buyer) {
    throw new Error("Buyer not found");
}

const buyerLocation = normalize(buyer.primaryLocation);
const flatType = buyer.requiredFlatType;
const transactionType = buyer.transactionType;

const tenants = await Tenant.find(
    {
        _id: { $ne: currentTenantId }
    },
    "name mobile email"
);

console.log("Buyer Tenant :", buyer.tenantId.toString());
console.log("Session Tenant:", currentTenantId.toString());
console.log("Searching tenants:", tenants.map(t => t._id.toString()));
    const result = [];

    for (const tenant of tenants) {

const builderCount = await Property.countDocuments({
    tenantId: tenant._id,
    propertyMode: "PROJECT",
    transactionType,
    propertyLocation: new RegExp(
    "^" +
    buyer.primaryLocation
        .replace(/\b(B\.?O\.?|S\.?O\.?|H\.?O\.?|G\.?P\.?O\.?)\b/gi, "")
        .replace(/\s+/g, "\\s*")
        .trim() +
    "(\\s*(B\\.?O\\.?|S\\.?O\\.?|H\\.?O\\.?|G\\.?P\\.?O\\.?)?)?$",
    "i"
),
    configurations: {
        $elemMatch: {
            flatType
        }
    }
});

const resaleCount = await Property.countDocuments({
    tenantId: tenant._id,
    propertyMode: "SINGLE",
    transactionType,
    singleFlatType: flatType,
    propertyLocation: new RegExp(
    "^" +
    buyer.primaryLocation
        .replace(/\b(B\.?O\.?|S\.?O\.?|H\.?O\.?|G\.?P\.?O\.?)\b/gi, "")
        .replace(/\s+/g, "\\s*")
        .trim() +
    "(\\s*(B\\.?O\\.?|S\\.?O\\.?|H\\.?O\\.?|G\\.?P\\.?O\\.?)?)?$",
    "i"
),
});

console.log({
    tenant: tenant._id.toString(),
    builderCount,
    resaleCount
});

        if (builderCount === 0 && resaleCount === 0) {
            continue;
        }

        result.push({
            tenantId: tenant._id,
            companyName: tenant.name,
            mobile: tenant.mobile,
            email: tenant.email,
            builderCount,
            resaleCount
        });

    }

    return result;

}

module.exports = {
    getMarketplaceMatches
};