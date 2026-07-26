const Tenant = require("../models/Tenant");

exports.getTenant = async (tenantUrl) => {

    const parts = tenantUrl.split(".");

    if (parts.length !== 2) {
        throw new Error(`Invalid tenant URL: ${tenantUrl}`);
    }

    const slug = parts[0];
    const tenantCode = parts[1].toUpperCase();

    console.log("Slug:", slug);

    console.log("Tenant Code:", tenantCode);

const tenant = await Tenant.findOne({
    tenantCode
});

if (!tenant) {
    throw new Error(`Tenant not found: ${tenantUrl}`);
}

if (!tenant.slug) {
    tenant.slug = slug;
    await tenant.save();
}

    if (!tenant) {
        const tenants = await Tenant.find({}, "slug tenantCode status").lean();
        console.log("Available Tenants:", tenants);

        throw new Error(`Tenant not found: ${tenantUrl}`);
    }

    return tenant;

};