const Tenant =
require('../models/Tenant')

module.exports =
async function(req,res,next){

if(
    !req.session.tenantId
){
    return res.redirect(
        '/login'
    )
}

const tenant =
await Tenant.findById(
    req.session.tenantId
)

if(!tenant){
    return res.redirect(
        '/login'
    )
}

if(!tenant.isActive){
    return res.send(
        'Company account is disabled'
    )
}

if(
    tenant.subscriptionEndDate &&
    tenant.subscriptionEndDate <
    new Date()
){

    tenant.isActive = false

    await tenant.save()

    return res.send(
        'Subscription expired'
    )
}

next()

}