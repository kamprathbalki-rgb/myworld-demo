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

const TenantAIUsage = require("../models/TenantAIUsage");

const SessionAudit =
require("../models/SessionAudit");

const generateTenantCode =
require('../utils/generateTenantCode')

const {
    sendDailyBusinessReport
} = require("../services/sendDailyBusinessReport");

router.get("/saas/ai-usage", async (req, res) => {

    if (
        !req.session.user ||
        req.session.user.role !== "saasadmin"
    ) {
        return res.redirect("/login");
    }

    const usage = await TenantAIUsage.aggregate([

        {
            $group: {
                _id: "$tenantId",
                requests: { $sum: 1 },
                promptTokens: { $sum: "$promptTokens" },
                completionTokens: { $sum: "$completionTokens" },
                totalTokens: { $sum: "$totalTokens" }
            }
        },

        {
            $lookup: {
                from: "tenants",
                localField: "_id",
                foreignField: "_id",
                as: "tenant"
            }
        },

        {
            $unwind: "$tenant"
        },

        {
            $sort: {
                totalTokens: -1
            }
        }

    ]);

    res.render("saasAIUsage", {
        usage
    });

});


router.get(
"/session-audit",
async(req,res)=>{

console.log("SESSION =", req.session);

console.log("USER =", req.session.user);

console.log("Session Audit User:", req.session.user);

if (
    !req.session.user ||
    req.session.user.role !== "saasadmin"
) {
    return res.redirect("/login");
}

const records =
await SessionAudit
.find({})
.populate(
"tenantId",
"name companyName"
)
.sort({
createdAt:-1
})
.limit(1000);

res.render(
"saasSessionAudit",
{
session:req.session,
records
});

});


router.get(
'/saas/dashboard',
async (req,res)=>{

console.log("Dashboard User:", req.session.user);

const today = new Date();

today.setHours(0, 0, 0, 0);

const totalLogins =
await SessionAudit.countDocuments({
    event: "LOGIN",
    createdAt: {
        $gte: today
    }
});

const totalLogouts =
await SessionAudit.countDocuments({
    event: "LOGOUT",
    createdAt: {
        $gte: today
    }
});

const sessionExpired =
await SessionAudit.countDocuments({
    event: "SESSION_EXPIRED",
    createdAt: {
        $gte: today
    }
});

if(
    !req.session.user ||
    req.session.user.role !== 'saasadmin'
){
    return res.redirect('/login')
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

const currentDate = new Date();

const next30Days = new Date();

next30Days.setDate(
    next30Days.getDate() + 30
)

const expiringSoon =
tenants.filter(t =>

    t.isActive &&

    t.subscriptionEndDate &&

   t.subscriptionEndDate >= currentDate &&

    t.subscriptionEndDate <= next30Days

)

const expiredCompanies =
tenants.filter(t =>

    t.subscriptionEndDate &&

   t.subscriptionEndDate < currentDate

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

totalLogins,
totalLogouts,
sessionExpired,

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

router.get(
'/saas/company/:id/features',
async (req,res)=>{

    if(
        !req.session.user ||
        req.session.user.role !== 'saasadmin'
    ){
        return res.redirect('/login')
    }

    const tenant =
    await Tenant.findById(
        req.params.id
    )

    if(!tenant){
        return res.redirect(
            '/saas/dashboard'
        )
    }

    res.render(
        'companyFeatures',
        {
            tenant
        }
    )

})

router.get(
'/saas/company/:id/feature/:feature',
async(req,res)=>{

    if(
        !req.session.user ||
        req.session.user.role !== 'saasadmin'
    ){
        return res.redirect('/login')
    }

    const tenant =
    await Tenant.findById(
        req.params.id
    )

    if(!tenant){

        return res.redirect(
            '/saas/dashboard'
        )

    }

    const feature =
    req.params.feature

    if(
        !tenant.features
    ){
        tenant.features = {}
    }

    tenant.features[feature] =
    !tenant.features[feature]

    await tenant.save()

    res.redirect(
        '/saas/company/' +
        tenant._id +
        '/features'
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

        mobile: req.body.mobile,

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

router.get(
    '/saas/generate-company-code',
    async (req, res) => {

        const tenantCode =
        await generateTenantCode()

        res.json({
            tenantCode
        })

    }
)

router.get(
    "/saas/test-daily-report/:tenantId",
    async (req, res) => {

        if (
            !req.session.user ||
            req.session.user.role !== "saasadmin"
        ) {
            return res.redirect("/login");
        }

        try {

            await sendDailyBusinessReport(
                req.params.tenantId
            );

            res.send(
                "Daily Business Report sent successfully."
            );

        } catch (err) {

            console.error(err);

            res.status(500).send(err.message);

        }

    }
);


module.exports = router