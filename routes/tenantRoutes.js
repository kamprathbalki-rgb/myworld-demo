const express = require('express')
const router = express.Router()

const User = require('../models/User')
const bcrypt = require('bcrypt')

const Tenant = require('../models/Tenant')

const statesData =
require('../data/states-and-districts.json')

const {sendEmail} = require('../utils/emailService')

router.get('/register-company',(req,res)=>{

res.render(
    'registerCompany',
    {
        states: statesData.states
    }
)

})

router.post('/register-company', async (req,res)=>{

const existingTenant =
await Tenant.findOne({
    email:req.body.email
})

if(existingTenant){

    return res.send(
        'Company email already registered'
    )

}

const startDate = new Date()

const endDate = new Date()

endDate.setMonth(
    endDate.getMonth() +
    Number(req.body.subscriptionMonths)
)

const tenant = new Tenant({

    name:req.body.name,

    email:req.body.email,

    adminName:
    req.body.adminName,

    adminEmail:
    req.body.adminEmail,

    stateName:req.body.stateName,

    primaryDistrict:req.body.primaryDistrict,

    subscriptionMonths:
        Number(req.body.subscriptionMonths),

    subscriptionStartDate:
        startDate,

    subscriptionEndDate:
        endDate,

    isActive:true

})

await tenant.save()

const hashed =
await bcrypt.hash(
    req.body.password,
    10
)

const user = new User({

    name:req.body.adminName,

    email:req.body.adminEmail,

    password:hashed,

    role:'admin',

    tenantId:tenant._id

})

await user.save()

await sendEmail(

tenant.email,

'Company Created',

`
<h2>Company Created</h2>

<p>
Company:
${tenant.name}
</p>

<p>
Admin:
${user.name}
</p>

<p>
Admin Email:
${user.email}
</p>

`

)

await sendEmail(

user.email,

'Admin Account Created',

`
<h2>Admin Account Created</h2>

<p>
Company:
${tenant.name}
</p>

<p>
Email:
${user.email}
</p>

`

)

req.session.success =
    tenant.name + ' created successfully'

res.redirect('/saas/dashboard')

})

module.exports = router