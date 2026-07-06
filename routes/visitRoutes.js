const express = require('express')
const router = express.Router()

const Visit = require('../models/Visit')

router.post('/schedule', async (req,res)=>{

const visit = new Visit({
...req.body,
tenantId:req.session.tenantId
})

await visit.save()

res.json(visit)

})

router.get('/list', async (req,res)=>{

const visits = await Visit.find({
tenantId:req.session.tenantId
})
.populate('propertyId')
.populate('buyerId')

res.json(visits)

})

router.put('/close/:id', async (req,res)=>{

const visit = await Visit.findOneAndUpdate(
{ _id:req.params.id, tenantId:req.session.tenantId },
{ dealClosed:true, status:"Completed" },
{ new:true }
)

res.json(visit)

})

module.exports = router