const express = require('express')
const router = express.Router()
const { isLoggedIn,isAdmin } = require('../middleware/auth')
const Visit = require('../models/Visit')
const Property = require('../models/Property')
const Buyer = require('../models/Buyer')
const MatchConfig = require('../models/MatchConfig')
const Executive = require('../models/Executive')
const BuyerProjectVisit = require('../models/BuyerProjectVisit')
const ExecutiveAttendance = require('../models/ExecutiveAttendance')
const Tenant = require('../models/Tenant')

router.get('/main', isLoggedIn, isAdmin, async (req,res)=>{

const tenant =
await Tenant.findById(
    req.session.tenantId
)

let daysRemaining = 0

if(
    tenant &&
    tenant.subscriptionEndDate
){

daysRemaining =
Math.max(
0,
Math.ceil(
(
tenant.subscriptionEndDate -
new Date()
) /
(1000 * 60 * 60 * 24)
)
)

}

const propertyCount = await Property.countDocuments({ tenantId:req.session.tenantId })
const buyerCount = await Buyer.countDocuments({ tenantId:req.session.tenantId })

const contacted = await Buyer.countDocuments({
    tenantId:req.session.tenantId,
    status:'Contacted'
})

const negotiation = await Buyer.countDocuments({
    tenantId:req.session.tenantId,
    status:'Negotiation'
})

const openBuyers = await Buyer.find({
    tenantId:req.session.tenantId,
    status:{
        $nin:['Deal Closed','Lost']
    }
})

const pipelineValue = openBuyers.reduce(
    (total,buyer)=>{

        const avg =
        (
            Number(buyer.minBudget || 0)
            +
            Number(buyer.maxBudget || 0)
        ) / 2

        return total + avg

    },
    0
)

const closedValue = await Buyer.aggregate([
{
    $match:{
    tenantId:req.session.tenantId,
    status:'Deal Closed'
}
},
{
    $group:{
        _id:null,
        total:{
            $sum:'$dealValue'
        }
    }
}
])

const lostValue = await Buyer.aggregate([
{
    $match:{
    tenantId:req.session.tenantId,
    status:'Lost'
}
},
{
    $group:{
        _id:null,
        total:{
            $sum:'$lostValue'
        }
    }
}
])

const pipelineCount = await Buyer.countDocuments({
    tenantId:req.session.tenantId,
    status:{
        $nin:['Deal Closed','Lost']
    }
})

const closedCount = await Buyer.countDocuments({
    tenantId:req.session.tenantId,
    status:'Deal Closed'
})

const lostCount = await Buyer.countDocuments({
    tenantId:req.session.tenantId,
    status:'Lost'
})


const today = new Date()
today.setHours(0,0,0,0)

const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)

const visitCount = await BuyerProjectVisit.countDocuments({
    tenantId:req.session.tenantId,
    scheduledVisitDate:{
        $gte:today,
        $lt:tomorrow
    }
})

const executives = await Executive.countDocuments({
    tenantId: req.session.tenantId
})

const followUps = await Buyer.countDocuments({
    tenantId: req.session.tenantId,
    nextFollowUp: {
        $gte: today,
        $lt: tomorrow
    }
})

const availableProperties =
    await Property.countDocuments({
        tenantId: req.session.tenantId,
        propertyStatus: { $ne: 'Sold' }
    })

const soldProperties =
    await Property.countDocuments({
        tenantId: req.session.tenantId,
        propertyStatus: 'Sold'
    })


const tokenProperties =
    await Property.countDocuments({
        tenantId: req.session.tenantId,
        propertyStatus: 'Token Received'
    })


res.render('dashboard',{

tenant,
daysRemaining,
properties: propertyCount,
buyers: buyerCount,
visits: visitCount,
executives,
followUps,
contacted,
negotiation,
pipelineCount,
closedCount,
lostCount,
pipelineValue,
availableProperties,
soldProperties,
closedValue:
closedValue[0]?.total || 0,
tokenProperties,
lostValue:
lostValue[0]?.total || 0

})

})

router.post('/match-config', async (req,res)=>{

const config = new MatchConfig({

tenantId:req.session.tenantId,

weights:{
price:Number(req.body.price),
bedrooms:Number(req.body.bedrooms),
area:Number(req.body.area),
distance:Number(req.body.distance)
},

extras:req.body.extras || []

})

await MatchConfig.deleteMany({ tenantId:req.session.tenantId })

await config.save()

res.redirect('/dashboard/match-config')

})


router.get('/saas-dashboard', (req,res)=>{
res.render('saasDashboard')
})

router.get('/match-config', async (req,res)=>{

const config = await MatchConfig.findOne({
tenantId:req.session.tenantId
})

res.render('matchConfig',{ config })

})


router.get('/company-dashboard', (req,res)=>{
res.render('companyDashboard')
})


router.get('/executive', async (req,res)=>{

const result = await Visit.aggregate([
{
$match:{ tenantId:req.session.tenantId }
},
{
$group:{
_id:"$executiveName",
totalVisits:{ $sum:1 },
completedVisits:{
$sum:{
$cond:[ { $eq:["$status","Completed"] },1,0 ]
}
}
}
}
])

res.json(result)

})


router.get('/followups', async (req,res)=>{

const today = new Date()

today.setHours(0,0,0,0)

const tomorrow = new Date(today)

tomorrow.setDate(today.getDate()+1)

const buyers = await Buyer.find({
tenantId:req.session.tenantId,
nextFollowUp:{
$gte:today,
$lt:tomorrow
}
})

res.render('followups',{ buyers })

})


router.get('/summary', async (req,res)=>{

const propertyCount = await Property.countDocuments({ tenantId:req.session.tenantId })

const buyerCount = await Buyer.countDocuments({ tenantId:req.session.tenantId })

const today = new Date()
today.setHours(0,0,0,0)

const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)

const visitCount = await BuyerProjectVisit.countDocuments({
    scheduledVisitDate: {
        $gte: today,
        $lt: tomorrow
    }
})

const dealsClosed = await Visit.countDocuments({ tenantId:req.session.tenantId, dealClosed:true })

res.json({

properties: propertyCount,

buyers: buyerCount,

visits: visitCount,

deals: dealsClosed

})

})

router.get('/sitevisits', async (req,res)=>{

const today = new Date()
today.setHours(0,0,0,0)

const tomorrow = new Date(today)
tomorrow.setDate(today.getDate()+1)

const visits = await BuyerProjectVisit.find({
scheduledVisitDate:{
$gte:today,
$lt:tomorrow
}
})
.populate('buyerId')
.populate('propertyId')

res.render('siteVisits',{
visits
})

})


router.get('/executive-page', isLoggedIn, async (req,res)=>{

const result = await Visit.aggregate([
{
$match:{ tenantId:req.session.tenantId }
},
{
$group:{
_id:"$executiveName",
totalVisits:{ $sum:1 },
dealsClosed:{
$sum:{
$cond:[ { $eq:["$dealClosed",true] },1,0 ]
}
}
}
}
])

res.render('executiveDashboard',{ data: result })

})


router.get('/sales-funnel', async (req,res)=>{

const funnel = await Buyer.aggregate([
{ $match:{ tenantId:req.session.tenantId } },

{
$group:{
_id:"$status",
count:{ $sum:1 }
}
}

])

res.render('salesFunnel',{ funnel })

})


router.get('/conversion-metrics', async (req,res)=>{

const leads = await Buyer.countDocuments({ tenantId:req.session.tenantId })

const visits = await Visit.countDocuments({ tenantId:req.session.tenantId })

const deals = await Visit.countDocuments({ tenantId:req.session.tenantId, dealClosed:true })

let visitConversion = 0
let dealConversion = 0

if(leads > 0){
visitConversion = ((visits / leads) * 100).toFixed(1)
}

if(visits > 0){
dealConversion = ((deals / visits) * 100).toFixed(1)
}

res.render('conversionMetrics',{
leads,
visits,
deals,
visitConversion,
dealConversion
})

})


router.get('/executive-performance', async (req,res)=>{

const data = await Visit.aggregate([
{
$match:{ tenantId:req.session.tenantId }
},
{
$group:{
_id:"$executiveName",
visits:{ $sum:1 },
deals:{
$sum:{
$cond:[ { $eq:["$dealClosed",true] },1,0 ]
}
}
}
}
])

const result = data.map(d=>{

let conversion = 0

if(d.visits > 0){
conversion = ((d.deals/d.visits)*100).toFixed(1)
}

return{
executive:d._id,
visits:d.visits,
deals:d.deals,
conversion
}

})

res.render('executivePerformance',{ data:result })

})


router.get('/revenue-dashboard', async (req,res)=>{

const deals = await Visit.find({
tenantId:req.session.tenantId,
dealClosed:true
}).populate('propertyId')

let totalRevenue = 0

deals.forEach(d=>{
if(d.propertyId && d.propertyId.price){
totalRevenue += d.propertyId.price
}
})

const avgDeal = deals.length ? (totalRevenue / deals.length).toFixed(0) : 0

const execRevenue = {}

deals.forEach(d=>{

const exec = d.executiveName

if(!execRevenue[exec]) execRevenue[exec] = 0

if(d.propertyId){
execRevenue[exec] += d.propertyId.price
}

})

res.render('revenueDashboard',{
totalRevenue,
avgDeal,
execRevenue
})

})


router.get('/admin-dashboard', async (req,res)=>{

const propertyCount = await Property.countDocuments({ tenantId:req.session.tenantId })
const buyerCount = await Buyer.countDocuments({ tenantId:req.session.tenantId })

const today = new Date()

today.setHours(0,0,0,0)

const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)

const visitCount = await BuyerProjectVisit.countDocuments({
    scheduledVisitDate: {
        $gte: today,
        $lt: tomorrow
    }
})

const dealsClosed = await Visit.countDocuments({ tenantId:req.session.tenantId, dealClosed:true })

const deals = await Visit.find({
tenantId:req.session.tenantId,
dealClosed:true
}).populate('propertyId')

let revenue = 0

deals.forEach(d=>{
if(d.propertyId && d.propertyId.price){
revenue += d.propertyId.price
}
})

const execStats = await Visit.aggregate([
{
$match:{ tenantId:req.session.tenantId }
},
{
$group:{
_id:"$executiveName",
visits:{ $sum:1 },
deals:{
$sum:{
$cond:[ { $eq:["$dealClosed",true] },1,0 ]
}
}
}
}
])

let topExecutive = execStats.length ? execStats[0]._id : "N/A"

res.render('adminDashboard',{
propertyCount,
buyerCount,
visitCount,
dealsClosed,
revenue,
topExecutive
})

})


router.get('/attendance-report', async (req, res) => {

    if (!req.session.tenantId) {
        return res.redirect('/login')
    }

    const records = await ExecutiveAttendance.find({
        tenantId: req.session.tenantId
    }).sort({ date: -1 })

    res.render('adminAttendanceReport', {
        records
    })

})

router.get('/analytics', async (req,res)=>{

const visits = await Visit.aggregate([
{ $match:{ tenantId:req.session.tenantId } },
{
$group:{
_id:{ $month:"$scheduledVisitDate" },
count:{ $sum:1 }
}
},
{ $sort:{ _id:1 } }
])

const deals = await Visit.aggregate([
{ $match:{ tenantId:req.session.tenantId, dealClosed:true } },
{
$group:{
_id:{ $month:"$scheduledVisitDate" },
count:{ $sum:1 }
}
},
{ $sort:{ _id:1 } }
])

const topProperties = await Visit.aggregate([
{ $match:{ tenantId:req.session.tenantId } },
{
$lookup:{
from:"properties",
localField:"propertyId",
foreignField:"_id",
as:"property"
}
},

{ $unwind:"$property" },

{
$group:{
_id:"$property.city",
visits:{ $sum:1 }
}
},

{ $sort:{ visits:-1 } },

{ $limit:5 }

])


res.render('analytics',{
visits,
deals,
topProperties
})

})


router.get('/demand-heatmap', async (req,res)=>{

const buyers = await Buyer.find({
tenantId:req.session.tenantId,
preferredLocation:{ $exists:true, $ne:null }
})

const points = buyers.map(b=>{

return {
lat:b.preferredLocation.coordinates[1],
lng:b.preferredLocation.coordinates[0]
}

})

res.render('heatmap',{ points })

})

router.get('/demand-prediction', async (req,res)=>{

const topBedrooms = await Buyer.aggregate([
{
    $match:{
        tenantId:req.session.tenantId
    }
},
{
    $group:{
        _id:"$requiredFlatType",
        count:{ $sum:1 }
    }
},
{
    $sort:{ count:-1 }
},
{
    $limit:10
}
])

const budgetRanges = await Buyer.aggregate([
{
    $match:{
        tenantId:req.session.tenantId
    }
},
{
    $project:{
        range:{
            $switch:{
                branches:[
                    {
                        case:{ $lte:["$maxBudget",50] },
                        then:"0-50 Lakhs"
                    },
                    {
                        case:{ $lte:["$maxBudget",100] },
                        then:"50-100 Lakhs"
                    },
                    {
                        case:{ $lte:["$maxBudget",200] },
                        then:"1-2 Cr"
                    }
                ],
                default:"2 Cr+"
            }
        }
    }
},
{
    $group:{
        _id:"$range",
        count:{ $sum:1 }
    }
},
{
    $sort:{ count:-1 }
}
])

res.render('demandPrediction',{
    topBedrooms,
    budgetRanges
})

})


router.get('/intelligence', async (req,res)=>{

// Top Locations by Buyer Interest
const topLocations = await Buyer.aggregate([
{
$match:{ tenantId:req.session.tenantId }
},
{
$group:{
_id:"$preferredLocation.coordinates",
count:{ $sum:1 }
}
},
{ $sort:{ count:-1 } },
{ $limit:5 }
])

// Top Bedroom Demand
const bedroomDemand = await Buyer.aggregate([
{
$match:{ tenantId:req.session.tenantId }
},
{
$group:{
_id:"$requiredFlatType",
count:{ $sum:1 }
}
},
{ $sort:{ count:-1 } }
])

// Top Budget Demand
const budgetDemand = await Buyer.aggregate([
{
$match:{ tenantId:req.session.tenantId }
},
{
$project:{
range:{
$concat:[
{ $toString:"$minBudget" },
"-",
{ $toString:"$maxBudget" }
]
}
}
},
{
$group:{
_id:"$range",
count:{ $sum:1 }
}
},
{ $sort:{ count:-1 } }
])

// Most Visited Properties
const topProperties = await BuyerProjectVisit.aggregate([
{
$match:{ tenantId:req.session.tenantId }
},
{
$lookup:{
from:"properties",
localField:"propertyId",
foreignField:"_id",
as:"property"
}
},
{ $unwind:"$property" },
{
$group:{
_id:"$property.projectName",
visits:{ $sum:1 }
}
},
{ $sort:{ visits:-1 } },
{ $limit:5 }
])

res.render('intelligence',{
topLocations,
bedroomDemand,
budgetDemand,
topProperties
})

})

router.get('/price-trend', async (req,res)=>{

const trends = await Visit.aggregate([

{ $match:{ tenantId:req.session.tenantId, dealClosed:true } },

{
$lookup:{
from:"properties",
localField:"propertyId",
foreignField:"_id",
as:"property"
}
},

{ $unwind:"$property" },

{
$group:{
_id:{
month:{ $month:"$scheduledVisitDate" },
city:"$property.city"
},
avgPrice:{ $avg:"$property.price" }
}
},

{ $sort:{ "_id.month":1 } }

])

res.render('priceTrend',{ trends })

})

router.get('/hot-locations', async (req,res)=>{

const demand = await Buyer.aggregate([
{
$match:{ tenantId:req.session.tenantId }
},
{
$group:{
_id:"$primaryLocation",
buyers:{ $sum:1 }
}
},
{
$match:{
_id:{ $ne:null }
}
}
])

const visits = await BuyerProjectVisit.aggregate([
{
$match:{ tenantId:req.session.tenantId }
},
{
$lookup:{
from:"properties",
localField:"propertyId",
foreignField:"_id",
as:"property"
}
},
{ $unwind:"$property" },
{
$group:{
_id:"$property.propertyLocation",
visits:{ $sum:1 }
}
}
])

const deals = await Buyer.aggregate([
{
$match:{
tenantId:req.session.tenantId,
status:'Deal Closed'
}
},
{
$group:{
_id:"$primaryLocation",
deals:{ $sum:1 }
}
}
])

const scoreMap = {}

demand.forEach(d=>{
scoreMap[d._id] = { buyers:d.buyers, visits:0, deals:0 }
})

visits.forEach(v=>{
if(!scoreMap[v._id]) scoreMap[v._id] = { buyers:0, visits:0, deals:0 }
scoreMap[v._id].visits = v.visits
})

deals.forEach(d=>{
if(!scoreMap[d._id]) scoreMap[d._id] = { buyers:0, visits:0, deals:0 }
scoreMap[d._id].deals = d.deals
})

const result = Object.keys(scoreMap).map(location=>{

const data = scoreMap[city]

const score = data.buyers + data.visits + (data.deals*3)

return{
city: location,
buyers:data.buyers,
visits:data.visits,
deals:data.deals,
score
}

})

result.sort((a,b)=>b.score-a.score)

res.render('hotLocations',{ locations:result })

})


router.get('/investment-opportunities', async (req,res)=>{

const buyers = await Buyer.aggregate([
{
$match:{ tenantId:req.session.tenantId }
},
{
$group:{
_id:"$primaryLocation",
demand:{ $sum:1 }
}
},
{
$match:{
_id:{ $ne:null }
}
}
])

const visits = await BuyerProjectVisit.aggregate([
{
$match:{ tenantId:req.session.tenantId }
},
{
$lookup:{
from:"properties",
localField:"propertyId",
foreignField:"_id",
as:"property"
}
},
{ $unwind:"$property" },
{
$group:{
_id:"$property.propertyLocation",
visits:{ $sum:1 }
}
}
])

const deals = await Buyer.aggregate([
{
$match:{
tenantId:req.session.tenantId,
status:'Deal Closed'
}
},
{
$group:{
_id:"$primaryLocation",
deals:{ $sum:1 }
}
}
])

const map = {}

buyers.forEach(b=>{
map[b._id] = { demand:b.demand, visits:0, deals:0 }
})

visits.forEach(v=>{
if(!map[v._id]) map[v._id] = { demand:0, visits:0, deals:0 }
map[v._id].visits = v.visits
})

deals.forEach(d=>{
if(!map[d._id]) map[d._id] = { demand:0, visits:0, deals:0 }
map[d._id].deals = d.deals
})

const result = Object.keys(map).map(location=>{

const data = map[city]

const opportunityScore =
(data.demand * 2) +
data.visits -
(data.deals * 2)

return{
city: location,
demand:data.demand,
visits:data.visits,
deals:data.deals,
score:opportunityScore
}

})

result.sort((a,b)=>b.score-a.score)

res.render('investmentFinder',{ locations:result })

})

router.get('/price-estimator', (req,res)=>{

res.render('priceEstimator')
})


router.post('/price-estimator', async (req,res)=>{

const { city, area } = req.body

const data = await Visit.aggregate([

{ $match:{ tenantId:req.session.tenantId, dealClosed:true } },

{
$lookup:{
from:"properties",
localField:"propertyId",
foreignField:"_id",
as:"property"
}
},

{ $unwind:"$property" },

{
$match:{
"property.city":city
}
},

{
$project:{
price:"$property.price",
area:"$property.area"
}
}

])

let avgPricePerSqft = 0

if(data.length){

const total = data.reduce((sum,d)=>sum+(d.price/d.area),0)

avgPricePerSqft = total / data.length

}

const estimatedPrice = Math.round(avgPricePerSqft * area)

res.render('priceEstimator',{
estimatedPrice,
city,
area
})

})

router.get('/deal-predictor', async (req,res)=>{

const properties = await Property.find({ tenantId:req.session.tenantId })

res.render('dealPredictor',{ properties })

})


router.post('/deal-predictor', async (req,res)=>{

const propertyId = req.body.propertyId

const property = await Property.findOne({
_id:propertyId,
tenantId:req.session.tenantId
})

const visits = await Visit.countDocuments({
propertyId,
tenantId:req.session.tenantId
})

const deals = await Visit.countDocuments({
propertyId,
tenantId:req.session.tenantId,
dealClosed:true
})

const demand = await Buyer.countDocuments({
tenantId:req.session.tenantId,
city:property.city
})

let probability = 0

if(visits > 0){

probability = (deals / visits) * 100

}

if(demand > 5){
probability += 10
}

if(probability > 100){
probability = 100
}

res.render('dealPredictor',{
properties:await Property.find({ tenantId:req.session.tenantId }),
result:{
title:property.title,
visits,
deals,
probability:probability.toFixed(1)
}
})

})

// ==========================================
// EXECUTIVE CURRENT STATUS
// ==========================================

router.get(
'/executive-status',
isLoggedIn,
isAdmin,
async (req,res)=>{

try{

    const today =
    new Date().toISOString().split('T')[0]


    const executives =
    await Executive.find({
        tenantId:req.session.tenantId
    })


    const attendanceRecords =
    await ExecutiveAttendance.find({
        tenantId:req.session.tenantId,
        date:today
    })


    const executiveStatus =
    executives.map(executive=>{


        const attendance =
        attendanceRecords.find(record=>
            String(record.executiveId)
            ===
            String(executive._id)
        )


        let status =
        'Not Checked In'

        let statusClass =
        'not-checked-in'

        let icon =
        '⚪'

        let lastActivity =
        '-'

        let lastActivityTime =
        '-'


        /*
        If attendance exists and there
        is at least one login, default
        status is At Office.
        */

        if(attendance){

            if(
                attendance.loginTimes &&
                attendance.loginTimes.length > 0
            ){

                status = 'At Office'

                statusClass =
                'at-office'

                icon = '🟢'

                lastActivity =
                'Login'

                lastActivityTime =
                attendance.loginTimes[
                    attendance.loginTimes.length - 1
                ]

            }


            /*
            Check latest activity.

            Existing login records may
            not contain an action field,
            so only override the status
            when an action exists.
            */

            if(
                attendance.activityLog &&
                attendance.activityLog.length
            ){

                const latestActivity =
                attendance.activityLog[
                    attendance.activityLog.length - 1
                ]


                if(latestActivity.time){

                    lastActivityTime =
                    latestActivity.time

                }


                if(latestActivity.action){

                    lastActivity =
                    latestActivity.action


                    switch(
                        latestActivity.action
                    ){


                        case 'login':

                            status =
                            'At Office'

                            statusClass =
                            'at-office'

                            icon =
                            '🟢'

                            break


                        case 'teaOut':

                            status =
                            'Tea Break'

                            statusClass =
                            'on-break'

                            icon =
                            '🟡'

                            break


                        case 'teaIn':

                            status =
                            'At Office'

                            statusClass =
                            'at-office'

                            icon =
                            '🟢'

                            break


                        case 'lunchOut':

                            status =
                            'Lunch Break'

                            statusClass =
                            'on-break'

                            icon =
                            '🟠'

                            break


                        case 'lunchIn':

                            status =
                            'At Office'

                            statusClass =
                            'at-office'

                            icon =
                            '🟢'

                            break


                        case 'meetingOut':

                            status =
                            'Meeting / With Client'

                            statusClass =
                            'meeting'

                            icon =
                            '🟣'

                            break


                        case 'meetingIn':

                            status =
                            'At Office'

                            statusClass =
                            'at-office'

                            icon =
                            '🟢'

                            break


                        case 'siteVisitOut':

                            status =
                            'At Site'

                            statusClass =
                            'at-site'

                            icon =
                            '🔵'

                            break


                        case 'siteVisitIn':

                            status =
                            'At Office'

                            statusClass =
                            'at-office'

                            icon =
                            '🟢'

                            break


                        case 'logout':

                            status =
                            'Logged Out'

                            statusClass =
                            'logged-out'

                            icon =
                            '⚪'

                            break

                    }

                }

            }

        }


        return{

            id:
            executive._id,

            name:
            executive.name ||
            executive.executiveName ||
            'Executive',

            status,

            statusClass,

            icon,

            lastActivity,

            lastActivityTime

        }

    })


    res.render(
        'executiveStatus',
        {
            executives:
            executiveStatus
        }
    )


}catch(error){

    console.error(
        'Executive Status Error:',
        error
    )

    res.status(500).send(
        'Unable to load executive status'
    )

}

})


module.exports = router

module.exports = router