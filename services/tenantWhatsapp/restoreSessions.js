const TenantWhatsapp =
require('../../models/TenantWhatsapp')

const createClient =
require('./createClient')

async function restoreSessions() {

const tenants =
await TenantWhatsapp.find({
isAuthenticated: true
})

for (const tenant of tenants) {

await createClient(
tenant.tenantId.toString()
)

console.log(
'RESTORED:',
tenant.tenantId
)

}

}

module.exports =
restoreSessions