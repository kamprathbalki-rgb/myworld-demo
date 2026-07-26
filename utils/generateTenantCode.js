const Tenant = require('../models/Tenant');

async function generateTenantCode() {
    let code;

    do {
        code = Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase();
    } while (await Tenant.exists({ tenantCode: code }));

    return code;
}

module.exports = generateTenantCode;