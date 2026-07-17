const express = require('express')
const router = express.Router()

const OfficeLocation =
require('../models/OfficeLocation')

router.get(
'/office-location',
async(req,res)=>{

const office =
await OfficeLocation.findOne({

    tenantId:
    req.session.tenantId,

    active:true

})

res.render(
'officeLocation',
{
    office
}
)

})

router.post(
'/office-location',
async(req,res)=>{

try{

await OfficeLocation.updateMany(
{
    tenantId:
    req.session.tenantId
},
{
    active:false
}
)

await OfficeLocation.create({

tenantId:
req.session.tenantId,

officeName:
req.body.officeName,

latitude:
Number(
req.body.latitude
),

longitude:
Number(
req.body.longitude
),

accuracy:
Number(
req.body.accuracy
),

radiusMeters:
Number(
req.body.radiusMeters
),

captureMethod:
req.body.captureMethod,

active:true

})

res.redirect(
'/admin/office-location'
)

}catch(err){

console.log(
'OFFICE SAVE ERROR:',
err.message
)

res.send(
err.message
)

}

})

module.exports = router