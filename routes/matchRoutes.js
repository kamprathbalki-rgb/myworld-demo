const express = require('express')
const router = express.Router()

const Property = require('../models/Property')
const Buyer = require('../models/Buyer')

const calculateScore = require('../services/matchService')

router.get('/:buyerId', async (req,res)=>{

const buyer = await Buyer.findOne({
_id:req.params.buyerId,
tenantId:req.session.tenantId
})

const properties = await Property.find({

tenantId:req.session.tenantId,

location:{
$near:{
$geometry:{
type:"Point",
coordinates: buyer.preferredLocation.coordinates
},
$maxDistance: buyer.radius
}
}
})

let results = []

for (const property of properties) {

let score = await calculateScore(property,buyer)

results.push({
property,
score
})

}

results.sort((a,b)=> b.score - a.score)

res.json(results.slice(0,5))

})

module.exports = router