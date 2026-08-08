const express = require('express')

const router = express.Router()

const { isLoggedIn } =
require('../middleware/auth')

const TenantWhatsapp =
require('../models/TenantWhatsapp')


const Tenant =
require('../models/Tenant')


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

async function isWhatsappEnabled(req,res){

    const tenant =
    await Tenant.findById(
        req.session.tenantId
    )

    if(
        !tenant ||
        !tenant.features ||
        !tenant.features.whatsapp
    ){
        res
        .status(403)
        .send(
        "WhatsApp feature is not enabled."
        )

        return null
    }

    return tenant

}


router.get(
'/qr',
isLoggedIn,
async (req,res)=>{


const tenant =
await isWhatsappEnabled(
    req,res
)

if(!tenant){
    return
}

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

    const tenant =
    await isWhatsappEnabled(
        req,res
    )

    if(!tenant){
        return
    }

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

const tenant =
await isWhatsappEnabled(
    req,res
)

if(!tenant){
    return
}

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