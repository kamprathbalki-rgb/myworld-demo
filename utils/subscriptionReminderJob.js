const cron =
require('node-cron')

const Tenant =
require('../models/Tenant')

const {
sendEmail
} = require('./emailService')

cron.schedule(
'0 9 * * *',
async ()=>{

const tenants =
await Tenant.find({
    isActive:true
})

for(
const tenant of tenants
){

if(
!tenant.subscriptionEndDate
){
continue
}

const daysLeft =
Math.ceil(
(
tenant.subscriptionEndDate -
new Date()
) /
(1000 * 60 * 60 * 24)
)

if(
daysLeft === 10 ||
daysLeft === 3 ||
daysLeft === 0
){

const subject =
daysLeft === 0
? 'Subscription Expires Today'
: `Subscription Expires In ${daysLeft} Days`

const html = `
<h2>
Subscription Reminder
</h2>

<p>
Company:
${tenant.name}
</p>

<p>
Expiry:
${tenant.subscriptionEndDate.toLocaleDateString()}
</p>

<p>
Days Left:
${daysLeft}
</p>
`

await sendEmail(
tenant.email,
subject,
html
)

if(
tenant.adminEmail
){

await sendEmail(
tenant.adminEmail,
subject,
html
)

}

}

}

}
)