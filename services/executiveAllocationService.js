const Executive = require("../models/Executive");

function normalizeLocation(location = "") {

    return location
        .toString()
        .trim()
        .replace(/\s+(B\.?O\.?|S\.?O\.?|H\.?O\.?)$/i, "")
        .replace(/\s+/g, " ")
        .toLowerCase();

}

async function allocateExecutive(
    tenantId,
    executiveType,
    primaryLocation
) {

    const executives = await Executive.find({

        tenantId,
        executiveType,
        isActive: true

    });

    const normalizedPrimary =
        normalizeLocation(primaryLocation);

    return executives.find(executive =>

        executive.assignedLocations.some(location =>

            normalizeLocation(location) ===
            normalizedPrimary

        )

    ) || null;

}

async function allocatePreSalesExecutive(
    tenantId,
    primaryLocation
) {

    return allocateExecutive(
        tenantId,
        "PreSales",
        primaryLocation
    );

}

async function allocateSalesExecutive(
    tenantId,
    primaryLocation
) {

    return allocateExecutive(
        tenantId,
        "Sales",
        primaryLocation
    );

}

module.exports = {

    allocatePreSalesExecutive,
    allocateSalesExecutive

};