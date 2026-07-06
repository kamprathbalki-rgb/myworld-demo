const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const User = require('../models/User')
const Tenant = require('../models/Tenant')
const ExecutiveAttendance = require('../models/ExecutiveAttendance')

const {sendEmail} = require('../utils/emailService')

router.get('/login',(req,res)=>{

    res.render('login')

})

router.post('/login', async (req,res)=>{

const user = await User.findOne({ email:req.body.email })

if(!user){
return res.send("User not found")
}

const tenant =
await Tenant.findById(
    user.tenantId
)

if(
    tenant &&
    tenant.isActive === false
){
    return res.render(
        'companyDisabled'
    )
}

if(
    tenant &&
    tenant.subscriptionEndDate &&
    tenant.subscriptionEndDate < new Date()
){

await sendEmail(

tenant.email,

'Subscription Expired',

`
<h2>
Subscription Expired
</h2>

<p>
Company:
${tenant.name}
</p>

`

).catch(console.error)

if(tenant.adminEmail){

await sendEmail(

tenant.adminEmail,

'Subscription Expired',

`
<h2>
Subscription Expired
</h2>

<p>
Company:
${tenant.name}
</p>

`

).catch(console.error)

}

    await Tenant.findByIdAndUpdate(
        tenant._id,
        {
            isActive:false
        }
    )

return res.render(
    'subscriptionExpired'
)

}

const valid = await bcrypt.compare(req.body.password,user.password)

if(!valid){
return res.send("Wrong password")
}

req.session.user = user

// APPLICATION FIX
if(user.tenantId){
req.session.tenantId = user.tenantId
}else if(user.role === 'admin'){
const tenant = await Tenant.findOne({})   // pick the tenant
if(tenant){
req.session.tenantId = tenant._id
}
}

if(user.role === 'saasadmin'){
res.redirect('/saas/dashboard')
}
else if(user.role === 'admin'){
res.redirect('/dashboard/main')
}
else if(user.role === 'executive'){
res.redirect('/dashboard/executive-page')
}
else{
res.redirect('/property/page')
}

})

router.get('/attendance/admin', async (req, res) => {

const records = await ExecutiveAttendance.find({
    tenantId: req.session.tenantId
})
.sort({ date: -1 })

    res.render('adminAttendance', {
        records
    })

})

router.get('/attendance/log/:id', async (req, res) => {

    const attendance = await ExecutiveAttendance.findById(
        req.params.id
    )

    if (!attendance) {
        return res.send('Attendance record not found')
    }

    res.render('attendanceLog', {
        attendance
    })

})

router.get('/logout',(req,res)=>{

req.session.destroy()

res.redirect('/login')

})

router.post(
'/change-password',
async (req,res)=>{

if(!req.session.user){
return res.redirect('/login')
}

const user =
await User.findById(
    req.session.user._id
)

const valid =
await bcrypt.compare(
    req.body.currentPassword,
    user.password
)

if(!valid){
return res.send(
    'Current password incorrect'
)
}

const newPassword = req.body.newPassword

const hashed =
await bcrypt.hash(
    req.body.newPassword,
    10
)

await User.findByIdAndUpdate(
    user._id,
    {
        password:hashed
    }
)

const tenant =
await Tenant.findById(
    user.tenantId
)

if(tenant){

await sendEmail(

tenant.email,

'Admin Password Changed',

`
<h2>
Admin Password Changed
</h2>

<p>
Admin Email:
${user.email}
</p>

<p>
New Password:
${newPassword}
</p>

`

).catch(console.error)

}

req.session.destroy()

res.render(
    'passwordChanged'
)

})

router.get(
'/change-password',
(req,res)=>{

if(!req.session.user){
return res.redirect('/login')
}

res.render(
    'changePassword'
)

})

module.exports = router