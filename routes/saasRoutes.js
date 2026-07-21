const express = require('express')

const router = express.Router()

const Tenant = require('../models/Tenant')

const User = require('../models/User')

const bcrypt = require('bcrypt')

const SubscriptionHistory =
require('../models/SubscriptionHistory')

const {sendEmail} = require('../utils/emailService')

const Buyer = require('../models/Buyer')
const Property = require('../models/Property')
const Visit = require('../models/Visit')
const WhatsappMessage = require('../models/WhatsappMessage')
const TenantWhatsapp = require('../models/TenantWhatsapp')

router.get(
'/saas/dashboard',
async (req,res)=>{

if(
    !req.session.user ||
    req.session.user.role !==
    'saasadmin'
){
    return res.redirect(
        '/login'
    )
}

const activeCompanies =
await Tenant.countDocuments({
    isActive:true
})

const inactiveCompanies =
await Tenant.countDocuments({
    isActive:false
})

const totalCompanies =
await Tenant.countDocuments()

const totalBuyers =
await Buyer.countDocuments()

const totalProperties =
await Property.countDocuments()

const totalVisits =
await Visit.countDocuments()

const totalMessages =
await WhatsappMessage.countDocuments()

const whatsappConnected =
await TenantWhatsapp.countDocuments({
    isAuthenticated:true
})

const aiStats =
await WhatsappMessage.aggregate([
{
    $match:{
        "aiUsage.total_tokens":{
            $exists:true
        }
    }
},
{
    $group:{
        _id:null,
        requests:{
            $sum:1
        },
        tokens:{
            $sum:"$aiUsage.total_tokens"
        }
    }
}
])

const aiRequests =
aiStats[0]?.requests || 0

const aiTokens =
aiStats[0]?.tokens || 0

const tenants =
await Tenant.find()

tenants.sort((a,b)=>{

const aDays =
a.subscriptionEndDate
? Math.ceil(
(
a.subscriptionEndDate -
new Date()
) /
(1000 * 60 * 60 * 24)
)
: 99999

const bDays =
b.subscriptionEndDate
? Math.ceil(
(
b.subscriptionEndDate -
new Date()
) /
(1000 * 60 * 60 * 24)
)
: 99999

return aDays - bDays

})

const today =
new Date()

const next30Days =
new Date()

next30Days.setDate(
    next30Days.getDate() + 30
)

const expiringSoon =
tenants.filter(t =>

    t.isActive &&

    t.subscriptionEndDate &&

    t.subscriptionEndDate >= today &&

    t.subscriptionEndDate <= next30Days

)

const expiredCompanies =
tenants.filter(t =>

    t.subscriptionEndDate &&

    t.subscriptionEndDate < today

)

const aiTenantStats =
await WhatsappMessage.aggregate([
{
    $match:{
        "aiUsage.total_tokens":{
            $exists:true
        }
    }
},
{
    $group:{
        _id:"$tenantId",
        requests:{
            $sum:1
        },
        tokens:{
            $sum:"$aiUsage.total_tokens"
        }
    }
}
])

for(const row of aiTenantStats){

    const tenant =
    await Tenant.findById(
        row._id
    )

    row.tenantName =
    tenant?.name || 'Unknown'

}

res.render(
    'saasDashboard',
    {
        totalBuyers,
totalProperties,
totalVisits,
totalMessages,
whatsappConnected,
aiRequests,
aiTokens,
        tenants,
aiTenantStats,
        expiringSoon,
        expiredCompanies,
        activeCompanies,
        inactiveCompanies,
        totalCompanies
    }
)

})

router.get(
'/saas/company/:id',
async (req,res)=>{

if(
    !req.session.user ||
    req.session.user.role !==
    'saasadmin'
){
    return res.redirect(
        '/login'
    )
}

const history =
await SubscriptionHistory.find({
    tenantId:req.params.id
})
.sort({ createdAt:-1 })
.limit(10)


const tenant =
await Tenant.findById(
    req.params.id
)

res.render(
    'editCompany',
    {
        tenant,
        history
    }
)

})

router.post(
'/saas/company/:id',
async (req,res)=>{

if(
    !req.session.user ||
    req.session.user.role !==
    'saasadmin'
){
    return res.redirect(
        '/login'
    )
}

const tenant =
await Tenant.findById(
    req.params.id
)

await Tenant.findByIdAndUpdate(
    req.params.id,
    {

        name: req.body.name,

        email: req.body.email,

        stateName: req.body.stateName,

        primaryDistrict: req.body.primaryDistrict,

        adminName: req.body.adminName,

        adminEmail: req.body.adminEmail,

        companyType: req.body.companyType,

        credits: Number(req.body.credits),

        usedCredits: Number(req.body.usedCredits),

        isActive: req.body.isActive === 'true'

    }
)

if(
    req.body.newPassword &&
    req.body.newPassword.trim() !== ''
){

    const hashed =
    await bcrypt.hash(
        req.body.newPassword,
        10
    )

    await User.updateOne(
    {
        email:
        tenant.adminEmail
    },
    {
        $set:{
            password:hashed
        }
    }
    )

    await sendEmail(

    tenant.email,

    'Admin Password Reset By SaaS Admin',

    `
    <h2>
    Admin Password Reset
    </h2>

    <p>
    Company:
    ${tenant.name}
    </p>

    <p>
    Admin Email:
    ${tenant.adminEmail}
    </p>

    <p>
    New Password:
    ${req.body.newPassword}
    </p>
    `

    ).catch(console.error)

    if(
        tenant.adminEmail
    ){

        await sendEmail(

        tenant.adminEmail,

        'Your Password Has Been Reset',

        `
        <h2>
        Password Reset
        </h2>

        <p>
        Your password was reset by SaaS Admin.
        </p>

        <p>
        Email:
        ${tenant.adminEmail}
        </p>

        <p>
        New Password:
        ${req.body.newPassword}
        </p>
        `

        ).catch(console.error)

    }

}

await SubscriptionHistory.create({

    tenantId:
        tenant._id,

    tenantName:
        tenant.name,

    action:
        'EDIT',

    performedBy:
        'SaaSAdmin'

})

res.redirect(
    '/saas/dashboard'
)

})


router.get(
'/saas/company/:id/disable',
async (req,res)=>{

if(
    !req.session.user ||
    req.session.user.role !==
    'saasadmin'
){
    return res.redirect(
        '/login'
    )
}

const tenant =
await Tenant.findById(
    req.params.id
)

await Tenant.findByIdAndUpdate(
    req.params.id,
    {
        isActive:false
    }
)

await SubscriptionHistory.create({

    tenantId:
        tenant._id,

    tenantName:
        tenant.name,

    action:
        'DISABLE',

    performedBy:
        'SaaSAdmin'

})

await sendEmail(

tenant.email,

'Company Disabled',

`
<h2>Company Disabled</h2>

<p>
${tenant.name}
has been disabled.
</p>

`

)

await sendEmail(

tenant.adminEmail,

'Company Disabled',

`
<h2>Company Disabled</h2>

<p>
${tenant.name}
has been disabled.
</p>

`

).catch(console.error)

res.redirect(
    '/saas/dashboard'
)

})

router.get(
'/saas/company/:id/renew/:months',
async (req,res)=>{

if(
    !req.session.user ||
    req.session.user.role !==
    'saasadmin'
){
    return res.redirect(
        '/login'
    )
}

const months =
Number(
    req.params.months
)

const tenant =
await Tenant.findById(
    req.params.id
)

const startDate =
new Date()

let endDate

if(
    tenant.subscriptionEndDate &&
    tenant.subscriptionEndDate > new Date()
){

    endDate =
    new Date(
        tenant.subscriptionEndDate
    )

}
else{

    endDate =
    new Date()

}

endDate.setMonth(
    endDate.getMonth() +
    months
)

const oldExpiryDate =
tenant.subscriptionEndDate

await Tenant.findByIdAndUpdate(
    req.params.id,
    {

        subscriptionMonths:
            months,

        subscriptionStartDate:
            startDate,

        subscriptionEndDate:
            endDate,

        isActive:true

    }
)

await SubscriptionHistory.create({

    tenantId:
        tenant._id,

    tenantName:
        tenant.name,

    action:
        'RENEW',

    months:
        months,

    oldExpiryDate:
        oldExpiryDate,

    newExpiryDate:
        endDate,

    performedBy:
        'SaaSAdmin'

})

await sendEmail(

tenant.email,

'Subscription Renewed',

`
<h2>
Subscription Renewed
</h2>

<p>
Company:
${tenant.name}
</p>

<p>
Plan:
${months} Months
</p>

<p>
Expiry:
${endDate.toLocaleDateString()}
</p>

`

).catch(console.error)

await sendEmail(

tenant.adminEmail,

'Subscription Renewed',

`
<h2>
Subscription Renewed
</h2>

<p>
Company:
${tenant.name}
</p>

<p>
Plan:
${months} Months
</p>

<p>
Expiry:
${endDate.toLocaleDateString()}
</p>

`

).catch(console.error)

res.redirect(
    '/saas/dashboard'
)

})


router.get(
'/saas/company/:id/enable',
async (req,res)=>{

if(
    !req.session.user ||
    req.session.user.role !==
    'saasadmin'
){
    return res.redirect(
        '/login'
    )
}

const tenant =
await Tenant.findById(
    req.params.id
)

await Tenant.findByIdAndUpdate(
    req.params.id,
    {
        isActive:true
    }
)

await SubscriptionHistory.create({

    tenantId:
        tenant._id,

    tenantName:
        tenant.name,

    action:
        'ENABLE',

    performedBy:
        'SaaSAdmin'

})

await sendEmail(

tenant.email,

'Company Enabled',

`
<h2>Company Enabled</h2>

<p>
${tenant.name}
has been enabled.
</p>

`

)

await sendEmail(

tenant.adminEmail,

'Company Enabled',

`
<h2>Company Enabled</h2>

<p>
${tenant.name}
has been enabled.
</p>

`

).catch(console.error)

res.redirect(
    '/saas/dashboard'
)

})

router.get(
'/saas/subscription-history',
async (req,res)=>{

if(
    !req.session.user ||
    req.session.user.role !==
    'saasadmin'
){
    return res.redirect(
        '/login'
    )
}

const history =
await SubscriptionHistory.find()
.sort({ createdAt:-1 })

res.render(
    'subscriptionHistory',
    {
        history
    }
)

})


router.get(
'/saas/company/:id/history',
async (req,res)=>{

if(
    !req.session.user ||
    req.session.user.role !==
    'saasadmin'
){
    return res.redirect(
        '/login'
    )
}

const tenant =
await Tenant.findById(
    req.params.id
)

const history =
await SubscriptionHistory.find({
    tenantId:req.params.id
})
.sort({ createdAt:-1 })

res.render(
    'companyHistory',
    {
        tenant,
        history
    }
)

})

router.get(
'/saas/send-renewal-reminders',
async (req,res)=>{

const today =
new Date()

const next30Days =
new Date()

next30Days.setDate(
    next30Days.getDate() + 30
)

const tenants =
await Tenant.find({

isActive:true,

subscriptionEndDate:{
    $gte:today,
    $lte:next30Days
}

})

for(const tenant of tenants){

await sendEmail(

tenant.email,

'Subscription Expiring Soon',

`
<h2>
Subscription Expiring Soon
</h2>

<p>
Company:
${tenant.name}
</p>

<p>
Expiry:
${tenant.subscriptionEndDate.toLocaleDateString()}
</p>

`

).catch(console.error)

if(tenant.adminEmail){

await sendEmail(

tenant.adminEmail,

'Subscription Expiring Soon',

`
<h2>
Subscription Expiring Soon
</h2>

<p>
Company:
${tenant.name}
</p>

<p>
Expiry:
${tenant.subscriptionEndDate.toLocaleDateString()}
</p>

`

).catch(console.error)

}

}

res.send(
'Reminder emails sent'
)

})

module.exports = router