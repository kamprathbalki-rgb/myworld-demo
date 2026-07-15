const express = require('express');
const router = express.Router();

const { isLoggedIn } = require('../middleware/auth');

const WhatsappInventory =
require('../models/WhatsappInventory');

const WhatsappRequirement =
require('../models/WhatsappRequirement');

router.get(
'/inventory',
isLoggedIn,
async (req,res)=>{

const inventory =
await WhatsappInventory.find({
tenantId:req.session.tenantId
})
.sort({ createdAt:-1 });

res.render(
'whatsappInventory',
{
inventory
}
);

});

router.get(
'/requirements',
isLoggedIn,
async (req,res)=>{

const requirements =
await WhatsappRequirement.find({
tenantId:req.session.tenantId
})
.sort({ createdAt:-1 });

res.render(
'whatsappRequirements',
{
requirements
}
);

});

module.exports = router;