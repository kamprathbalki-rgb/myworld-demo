const express = require('express')
const router = express.Router()
const { isLoggedIn, isAdmin } = require('../middleware/auth')
const Buyer = require('../models/Buyer')
const Property = require('../models/Property')
const Visit = require('../models/Visit')
const LocationMaster = require('../models/LocationMaster')
const calculateScore = require('../services/matchService')
const Recommendation = require('../models/Recommendation')
const Shortlist = require('../models/Shortlist')
const Executive = require('../models/Executive')

const BuyerProjectVisit = require('../models/BuyerProjectVisit')

router.post('/add', async (req,res)=>{

const buyer = new Buyer({
...req.body,
tenantId: req.session.tenantId
})

await buyer.save()

const properties = await Property.find({
tenantId: req.session.tenantId
})

let results = []

for (const property of properties) {

const score = await calculateScore(property, buyer)

results.push({
property,
score
})

}

results.sort((a,b) => b.score - a.score)

res.json({
buyer,
topMatches: results.slice(0,5)
})

})


router.get(
'/edit/:id',
isLoggedIn,
async (req, res) => {

    const buyer = await Buyer.findOne({
        _id: req.params.id,
        tenantId: req.session.tenantId
    })

    const locations = await LocationMaster.find({})
        .sort({ officeName: 1 })

    if (!buyer) {
        return res.send("Buyer not found")
    }

    res.render('editBuyer', {
        buyer,
        locations
    })

})

router.get(
'/delete/:id',
isLoggedIn,
isAdmin,
async (req, res) => {

await Buyer.findOneAndDelete({
    _id: req.params.id,
    tenantId: req.session.tenantId
})

res.redirect('/buyer/page')

})


router.get(
'/timeline/:buyerId',
isLoggedIn,
async (req,res)=>{

const buyer = await Buyer.findOne({
_id:req.params.buyerId,
tenantId:req.session.tenantId
})

const visits = await Visit.find({
buyerId:req.params.buyerId
}).populate('propertyId')

const shortlists = await Shortlist.find({
buyerId:req.params.buyerId
}).populate('propertyId')

res.render('timeline',{
buyer,
visits,
shortlists
})

})



router.get(
'/list',
isLoggedIn,
async (req,res)=>{

const buyers = await Buyer.find({ tenantId:req.session.tenantId })

res.json(buyers)

})

router.get(
'/shortlist/:buyerId',
isLoggedIn,
async (req,res)=>{

const list = await Shortlist.find({
buyerId:req.params.buyerId
}).populate('propertyId')

res.render('shortlist',{ list })

})


router.post(
'/update/:id',
isLoggedIn,
async (req, res) => {

if (!/^\d{10}$/.test(req.body.phone || '')) {

    return res.send(
        'Mobile number must be exactly 10 digits'
    )

}

if (
    Number(req.body.minBudget) >
    Number(req.body.maxBudget)
) {

    return res.send(
        'Minimum budget cannot exceed maximum budget'
    )

}

let selectedLocations = []

if (req.body.preferredLocation1)
    selectedLocations.push(req.body.preferredLocation1)

if (
    req.body.preferredLocation2 &&
    req.body.preferredLocation2 !== req.body.preferredLocation1
)
    selectedLocations.push(req.body.preferredLocation2)

if (
    req.body.preferredLocation3 &&
    !selectedLocations.includes(req.body.preferredLocation3)
)
    selectedLocations.push(req.body.preferredLocation3)

if (!Array.isArray(selectedLocations)) {
    selectedLocations = [selectedLocations]
}

const locationData = await LocationMaster.find({
    officeName: { $in: selectedLocations }
})

const preferredPincodes = [
    ...new Set(locationData.map(l => l.pincode))
]

const preferredDistricts = [
    ...new Set(locationData.map(l => l.district))
]

const preferredDivisionNames = [
    ...new Set(locationData.map(l => l.divisionName))
]

const stateName =
locationData.length > 0
? locationData[0].stateName
: ""

const requiredFlatType =
    req.body.apartmentFlatType ||
    req.body.otherFlatType ||
    ""

const minArea =
    req.body.apartmentMinArea ||
    req.body.otherMinArea ||
    null

const maxArea =
    req.body.apartmentMaxArea ||
    req.body.otherMaxArea ||
    null

let requiredPossession = req.body.requiredPossession || []

if (!Array.isArray(requiredPossession)) {
    requiredPossession = [requiredPossession]
}

let primaryLocation = req.body.primaryLocation

if (!primaryLocation && selectedLocations.length > 0) {
    primaryLocation = selectedLocations[0]
}

const duplicateBuyer = await Buyer.findOne({
    tenantId: req.session.tenantId,
    phone: req.body.phone,
    _id: { $ne: req.params.id }
})

if (duplicateBuyer) {
    return res.send(
        'Another buyer already uses this mobile number'
    )
}

await Buyer.findOneAndUpdate(
{
    _id: req.params.id,
    tenantId: req.session.tenantId,
},
{
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,

    minBudget: req.body.minBudget,
    maxBudget: req.body.maxBudget,

    requiredPossession: requiredPossession,

    requiredFlatType: requiredFlatType,

    minArea: minArea,
    maxArea: maxArea,

    radius: req.body.radius,

    preferredLocations: selectedLocations,
    primaryLocation: primaryLocation,
    preferredPincodes: preferredPincodes,
    preferredDistricts: preferredDistricts,
    preferredDivisionNames: preferredDivisionNames,
    stateName: stateName,

    preferredLocation: {
        type: "Point",
        coordinates: [
            parseFloat(req.body.lng) || 0,
            parseFloat(req.body.lat) || 0
        ]
    },

    status: req.body.status,
    followUpNotes: req.body.followUpNotes
}
)

res.redirect('/buyer/page')

})


router.post(
'/followup/:id',
isLoggedIn,
async (req,res)=>{

await Buyer.findByIdAndUpdate(

req.params.id,

{
nextFollowUp: req.body.nextFollowUp
    ? new Date(req.body.nextFollowUp)
    : null,
followUpNotes:req.body.followUpNotes
}

)

res.redirect('/buyer/page')

})


router.post(
'/status/:id',
isLoggedIn,
async (req,res)=>{

await Buyer.findByIdAndUpdate(

req.params.id,

{ status:req.body.status }

)

res.redirect('/buyer/page')

})

router.post(
'/save',
isLoggedIn,
async (req, res) => {

/*
Selected multiple preferred locations
from checkbox list
*/

if (!/^\d{10}$/.test(req.body.phone || '')) {

    return res.send(
        'Mobile number must be exactly 10 digits'
    )

}

if (
    Number(req.body.minBudget) >
    Number(req.body.maxBudget)
) {

    return res.send(
        'Minimum budget cannot exceed maximum budget'
    )

}

let selectedLocations = []

if (req.body.preferredLocation1)
    selectedLocations.push(req.body.preferredLocation1)

if (
    req.body.preferredLocation2 &&
    req.body.preferredLocation2 !== req.body.preferredLocation1
)
    selectedLocations.push(req.body.preferredLocation2)

if (
    req.body.preferredLocation3 &&
    !selectedLocations.includes(req.body.preferredLocation3)
)
    selectedLocations.push(req.body.preferredLocation3)

if (!Array.isArray(selectedLocations)) {
    selectedLocations = [selectedLocations]
}

/*
Fetch matching records from Location Master
*/

const locationData = await LocationMaster.find({
    officeName: { $in: selectedLocations }
})

/*
Auto-build master arrays
*/

const preferredPincodes = [
    ...new Set(locationData.map(l => l.pincode))
]

const preferredDistricts = [
    ...new Set(locationData.map(l => l.district))
]

const preferredDivisionNames = [
    ...new Set(locationData.map(l => l.divisionName))
]

const stateName =
locationData.length > 0
? locationData[0].stateName
: ""

const Executive = require('../models/Executive')

let primaryLocation = req.body.primaryLocation

if (!primaryLocation && selectedLocations.length > 0) {
    primaryLocation = selectedLocations[0]
}

const primaryLocationData =
locationData.find(
    l => l.officeName === primaryLocation
)

const buyerLat =
primaryLocationData?.lat || 0

const buyerLng =
primaryLocationData?.lng || 0

const matchedExecutive = await Executive.findOne({
    tenantId: req.session.tenantId,
    assignedLocations: primaryLocation,
    isActive: true
})

const requiredFlatType =
    (req.body.apartmentFlatType && req.body.apartmentFlatType.trim() !== "")
        ? req.body.apartmentFlatType
        : req.body.otherFlatType || ""

const minArea =
    (req.body.apartmentMinArea && req.body.apartmentMinArea !== "")
        ? req.body.apartmentMinArea
        : req.body.otherMinArea || null

const maxArea =
    (req.body.apartmentMaxArea && req.body.apartmentMaxArea !== "")
        ? req.body.apartmentMaxArea
        : req.body.otherMaxArea || null

let requiredPossession = req.body.requiredPossession || []

if (!Array.isArray(requiredPossession)) {
    requiredPossession = [requiredPossession]
}

const existingBuyer = await Buyer.findOne({
    tenantId: req.session.tenantId,
    phone: req.body.phone
})

if (existingBuyer) {
    return res.send(
        'Buyer with this mobile number already exists'
    )
}

const buyer = new Buyer({

    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,

    primaryLocation: primaryLocation,
    assignmentType: "AUTO",

    minBudget: req.body.minBudget,
    maxBudget: req.body.maxBudget,

    requiredPossession: requiredPossession,

    requiredFlatType: requiredFlatType,

    minArea: minArea,
    maxArea: maxArea,

    radius: req.body.radius,

    tenantId: req.session.tenantId,

    assignedExecutiveId: matchedExecutive ? matchedExecutive._id : null,
    assignedExecutiveName: matchedExecutive ? matchedExecutive.name : "",

    /*
    Selected locations
    */

    preferredLocations: selectedLocations,

    /*
    Auto-filled from locationmasters
    */

    preferredPincodes: preferredPincodes,
    preferredDistricts: preferredDistricts,
    preferredDivisionNames: preferredDivisionNames,
    stateName: stateName,

    /*
    Existing geo logic (kept for compatibility)
    */

preferredLocation: {
    type: "Point",
    coordinates: [
        buyerLat,
        buyerLng
    ]
}

})

await buyer.save()

res.redirect('/buyer/page')

})

router.get(
'/add',
isLoggedIn,
async (req, res) => {

const locations = await LocationMaster.find({})
.sort({ officeName: 1 })

res.render('addBuyer', {
locations
})

})


router.get(
'/page',
isLoggedIn,
async (req,res)=>{

const search = req.query.search || ''

const status = req.query.status || ''

let filter = {
    tenantId: req.session.tenantId
}

if(search){

    filter.$or = [

        { name: { $regex: search, $options:'i' } },

        { phone: { $regex: search, $options:'i' } },

        { primaryLocation: { $regex: search, $options:'i' } }

    ]
}

if(status){
    filter.status = status
}

const buyers = await Buyer.find(filter)

for (const buyer of buyers) {

    const latestVisit =
    await BuyerProjectVisit
        .findOne({
            buyerId: buyer._id
        })
        .sort({ updatedAt: -1 })

    buyer.latestVisitStatus =
        latestVisit ? latestVisit.visitType : 'No Visit'

    buyer.lastActivity =
        latestVisit ? latestVisit.updatedAt : null

}

const executives = await Executive.find({
    tenantId: req.session.tenantId,
    isActive: true
})

const newLeads = await Buyer.countDocuments({
    tenantId: req.session.tenantId,
    status: 'New Lead'
})

const contacted = await Buyer.countDocuments({
    tenantId: req.session.tenantId,
    status: 'Contacted'
})

const siteVisits = await Buyer.countDocuments({
    tenantId: req.session.tenantId,
    status: 'Site Visit'
})

const negotiations = await Buyer.countDocuments({
    tenantId: req.session.tenantId,
    status: 'Negotiation'
})

const closedDeals = await Buyer.countDocuments({
    tenantId: req.session.tenantId,
    status: 'Deal Closed'
})

const lostDeals = await Buyer.countDocuments({
    tenantId: req.session.tenantId,
    status: 'Lost'
})

res.render('buyers', {
    buyers,
    executives,
    search,
    status,
    newLeads,
    contacted,
    siteVisits,
    negotiations,
    closedDeals,
    lostDeals
})

})


router.post(
'/project-visit/:buyerId/:propertyId',
isLoggedIn,
async (req, res) => {

    const buyer = await Buyer.findOne({
        _id: req.params.buyerId,
        tenantId: req.session.tenantId
    })

    if (!buyer) {
        return res.send("Buyer not found")
    }

    const property = await Property.findOne({
        _id: req.params.propertyId,
        tenantId: req.session.tenantId
    })

    if (!property) {
        return res.send("Property not found")
    }

await BuyerProjectVisit.findOneAndUpdate(
    {
        buyerId: buyer._id,
        propertyId: property._id
    },
    {
        buyerId: buyer._id,
        propertyId: property._id,
        projectName: property.projectName,
        executiveId: req.session.executiveId || null,
        executiveName: req.session.executiveName || "Admin",
        visitType: req.body.visitType,
        tenantId: req.session.tenantId,
        scheduledVisitDate: req.body.scheduledVisitDate
    ? new Date(req.body.scheduledVisitDate)
    : null,
        remarks: req.body.remarks || "",
        buyerFeedback: "",
        builderFeedback: "",
        nextAction: ""
    },
    {
        upsert: true,
        new: true
    }
)

    res.redirect('/buyer/matches/' + buyer._id)

})


router.post(
'/reassign/:id',
isLoggedIn,
isAdmin,
async (req, res) => {

const Executive = require('../models/Executive')

const executive = await Executive.findOne({
    _id: req.body.executiveId,
    tenantId: req.session.tenantId
})

if (!executive) {
    return res.send("Executive not found")
}

await Buyer.findOneAndUpdate(
{
    _id: req.params.id,
    tenantId: req.session.tenantId
},
{
    assignedExecutiveId: executive._id,
    assignedExecutiveName: executive.name,
    assignmentType: "MANUAL"
}
)

res.redirect('/buyer/page')

})

router.get('/map', async (req,res)=>{

const buyers = await Buyer.find(
{
    tenantId:req.session.tenantId,
    "preferredLocation.coordinates.0": { $ne: 0 },
    "preferredLocation.coordinates.1": { $ne: 0 }
},
{
    name:1,
    primaryLocation:1,
    preferredLocation:1,
    minBudget:1,
    maxBudget:1
})

res.json(buyers)

})

router.get(
'/matches/:buyerId',
isLoggedIn,
async (req, res) => {

const buyer = await Buyer.findOne({
_id: req.params.buyerId,
tenantId: req.session.tenantId
})

const properties = await Property.find({
tenantId: req.session.tenantId
})

let results = []

for (const property of properties) {

const score = await calculateScore(property, buyer)

/*
Find exact matched configuration
based on buyer required flat type
*/

let matchedConfig = null

if (property.propertyMode === 'PROJECT') {

    matchedConfig = property.configurations.find(c =>
        c.flatType === buyer.requiredFlatType
    )

    if (!matchedConfig) {
        continue
    }

}

results.push({
property,
matchedConfig,
score
})

}

results.sort((a, b) => b.score - a.score)

const BuyerProjectVisit = require('../models/BuyerProjectVisit')

const visits = await BuyerProjectVisit.find({
    buyerId: buyer._id
})

res.render('matches', {
buyer,
matches: results.slice(0, 5),
visits
})

})


router.get('/executive-performance', async (req,res)=>{

const data = await Visit.aggregate([
{ $match:{ tenantId:req.session.tenantId } },

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

router.get('/smart-recommendations/:buyerId', async (req,res)=>{

const buyer = await Buyer.findOne({
_id: req.params.buyerId,
tenantId: req.session.tenantId
})

const properties = await Property.find({
tenantId: req.session.tenantId
}).limit(100)

let filteredProperties = []

properties.forEach(property => {

const matchedConfig = property.configurations.find(c =>

c.flatType === buyer.requiredFlatType &&

c.quotedPrice >= buyer.minBudget &&
c.quotedPrice <= buyer.maxBudget &&

c.carpetArea >= buyer.minArea &&
c.carpetArea <= buyer.maxArea

)

if(matchedConfig){
filteredProperties.push({
property,
matchedConfig
})
}

})

const propertyIds = filteredProperties.map(p => p.property._id)

const visitStats = await Visit.aggregate([

{
$match:{
tenantId: req.session.tenantId,
propertyId: { $in: propertyIds }
}
},

{
$group:{
_id: "$propertyId",
visits: { $sum: 1 },
deals: {
$sum: {
$cond: [
{ $eq: ["$dealClosed", true] },
1,
0
]
}
}
}
}

])

const statsMap = {}

visitStats.forEach(s => {
statsMap[s._id.toString()] = s
})

const results = filteredProperties.map(item => {

const stats = statsMap[item.property._id.toString()] || {
visits: 0,
deals: 0
}

let score = 50

score += Math.min(stats.visits * 2, 10)
score += Math.min(stats.deals * 5, 20)

return {
property: item.property,
configuration: item.matchedConfig,
score
}

})

results.sort((a,b) => b.score - a.score)

res.render('smartRecommendations',{
buyer,
properties: results.slice(0,5)
})

})

module.exports = router