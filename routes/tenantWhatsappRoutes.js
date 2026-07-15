const express = require('express')

const router = express.Router()

const { isLoggedIn } =
require('../middleware/auth')

const TenantWhatsapp =
require('../models/TenantWhatsapp')

const createClient =
require(
'../services/tenantWhatsapp/createClient'
)

const clientManager =
require(
'../services/tenantWhatsapp/clientManager'
)

const qrStore =
require(
'../services/tenantWhatsapp/qrStore'
)

const QRCode =
require('qrcode')

router.get(
'/qr',
isLoggedIn,
async (req,res)=>{

const tenantId =
req.session.tenantId

const qr =
qrStore[tenantId]

if(!qr){

const client =
clientManager[
tenantId
]

if(
client &&
client.info
){

return res.redirect(
'/buyer/whatsapp-groups'
)

}

return res.send(
'Generating QR... Refresh in 5 seconds.'
)

}

const qrImage =
await QRCode.toDataURL(
qr
)

res.render(
'tenantWhatsappQR',
{
qrImage
}
)

})

router.get(
'/',
isLoggedIn,
async (req,res)=>{

const whatsapp =
await TenantWhatsapp.findOne({

tenantId:
req.session.tenantId

})

res.render(
'tenantWhatsapp',
{
whatsapp
}
)

})

router.get(
'/connect',
isLoggedIn,
async (req,res)=>{

const tenantId =
req.session.tenantId

await createClient(
tenantId
)

res.redirect(
'/tenant-whatsapp/qr'
)

})

module.exports =
router