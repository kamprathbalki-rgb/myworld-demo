const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const Executive = require('../models/Executive')
const LocationMaster = require('../models/LocationMaster')

const ContactAccessLog = require('../models/ContactAccessLog')

const Property = require('../models/Property')
const calculateScore = require('../services/matchService')

const BuyerProjectVisit = require('../models/BuyerProjectVisit')

const {
    CONTACT_UNLOCK_TIMEOUT
} = require('../config/securityConfig')

const ExecutiveAttendance = require('../models/ExecutiveAttendance')

router.post('/unlock-contact/:id', async (req, res) => {

    if (!req.session.executiveId) {
        return res.redirect('/executive/login')
    }

    const buyer = await Buyer.findOne({
        _id: req.params.id,
        assignedExecutiveId: req.session.executiveId
    })

    if (!buyer) {
        return res.send("Buyer not found")
    }

    await ContactAccessLog.create({
        buyerId: buyer._id,
        executiveId: req.session.executiveId,
        executiveName: req.session.executiveName,
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent']
    })

req.session.unlockedBuyerId = buyer._id
req.session.unlockTime = new Date()

res.redirect('/executive/dashboard')

})

router.post('/project-visit/:buyerId/:propertyId', async (req, res) => {

    if (!req.session.executiveId) {
        return res.redirect('/executive/login')
    }

    const buyer = await Buyer.findOne({
        _id: req.params.buyerId,
        assignedExecutiveId: req.session.executiveId
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

    res.redirect('/executive/matches/' + buyer._id)

})

router.post('/status/:id', async (req,res)=>{
    await Buyer.findByIdAndUpdate(
        req.params.id,
        { status:req.body.status }
    )

    res.redirect('/executive/dashboard')
})

router.post('/followup/:id', async (req,res)=>{

const updateData = {

    status: req.body.status,

    nextFollowUp: req.body.nextFollowUp
        ? new Date(req.body.nextFollowUp)
        : null,

    siteVisitDate: req.body.siteVisitDate
        ? new Date(req.body.siteVisitDate)
        : null,

    followUpNotes: req.body.followUpNotes

}

    if (req.body.status === 'Deal Closed') {

        updateData.dealValue =
            Number(req.body.dealValue || 0)

        updateData.dealClosedDate =
            new Date()
    }

    if (req.body.status === 'Lost') {

        updateData.lostValue =
            Number(req.body.dealValue || 0)

        updateData.lostDate =
            new Date()
    }

if(req.body.siteVisitDate){

    const buyer = await Buyer.findById(
        req.params.id
    )

    await BuyerProjectVisit.create({

        tenantId:req.session.tenantId,

        buyerId:buyer._id,

        buyerName:buyer.name,

        executiveId:req.session.executiveId,

        executiveName:req.session.executiveName,

        scheduledVisitDate:
            new Date(req.body.siteVisitDate),

        visitType:'First Visit'

    })

}

    await Buyer.findByIdAndUpdate(
        req.params.id,
        updateData
    )

    res.redirect('/executive/dashboard')

})


router.get('/matches/:buyerId', async (req, res) => {

    if (!req.session.executiveId) {
        return res.redirect('/executive/login')
    }

    const buyer = await Buyer.findOne({
        _id: req.params.buyerId,
        assignedExecutiveId: req.session.executiveId
    })

    if (!buyer) {
        return res.send("Buyer not found")
    }

    const properties = await Property.find({
        tenantId: req.session.tenantId
    })

    let results = []

    for (const property of properties) {

        const score = await calculateScore(property, buyer)

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

const visits = await BuyerProjectVisit.find({
    buyerId: buyer._id
})

    res.render('executiveMatches', {
        buyer,
        matches: results.slice(0, 5),
        visits
    })

})

router.get('/add', async (req, res) => {

    const locations = await LocationMaster.find({})
        .sort({ officeName: 1 })

    res.render('addExecutive', {
        locations,
        executive:{},
        error: req.query.error || ''
    })

})


router.get('/buyer/edit/:id', async (req, res) => {

    if (!req.session.executiveId) {
        return res.redirect('/executive/login')
    }

    const buyer = await Buyer.findOne({
        _id: req.params.id,
        assignedExecutiveId: req.session.executiveId
    })

    if (!buyer) {
        return res.send("Buyer not found")
    }

    const locations = await LocationMaster.find({})
        .sort({ officeName: 1 })

    res.render('executiveEditBuyer', {
        buyer,
        locations
    })

})


router.post('/buyer/update/:id', async (req, res) => {

    if (!req.session.executiveId) {
        return res.redirect('/executive/login')
    }

    let preferredLocations = req.body.preferredLocations || []

    if (!Array.isArray(preferredLocations)) {
        preferredLocations = [preferredLocations]
    }

let requiredPossession = req.body.requiredPossession || []

if (!Array.isArray(requiredPossession)) {
    requiredPossession = [requiredPossession]
}

    await Buyer.findOneAndUpdate(
        {
            _id: req.params.id,
            assignedExecutiveId: req.session.executiveId
        },
        {
            minBudget: req.body.minBudget,
            maxBudget: req.body.maxBudget,
            requiredPossession: requiredPossession,
            requiredFlatType: req.body.requiredFlatType,
            minArea: req.body.minArea,
            maxArea: req.body.maxArea,
            preferredLocations: preferredLocations
        }
    )

    res.redirect('/executive/dashboard')

})

router.post('/save', async (req, res) => {

    if (!req.session.tenantId) {
        return res.send("ERROR: Tenant not in session. Please login again as admin.")
    }

    let assignedLocations = req.body.assignedLocations || []

    if (!Array.isArray(assignedLocations)) {
        assignedLocations = [assignedLocations]
    }

const duplicateLocation = await Executive.findOne({
    tenantId: req.session.tenantId,
    assignedLocations: { $in: assignedLocations }
})

if (duplicateLocation) {

    const clashLocation = assignedLocations.find(loc =>
        duplicateLocation.assignedLocations.includes(loc)
    )

    const locations = await LocationMaster.find({})
        .sort({ officeName: 1 })

    return res.render('addExecutive', {
        locations,
        executive: req.body,
        error: `${clashLocation} is already assigned to ${duplicateLocation.name}`
    })
}

const hashedPassword =
await bcrypt.hash(req.body.password, 10)

const executive = new Executive({
    name: req.body.name,
    mobile: req.body.mobile,
    email: req.body.email,
    password: hashedPassword,
    tenantId: req.session.tenantId,
    assignedLocations: assignedLocations,
    dateOfJoining: req.body.dateOfJoining || "",
    dateOfLeaving: req.body.dateOfLeaving || ""
})

    await executive.save()

    res.redirect('/executive/list')

})

router.get('/list', async (req, res) => {

    const executives = await Executive.find({
        tenantId: req.session.tenantId
    })

    res.render('executives', {
        executives
    })

})


router.get('/login', (req, res) => {
    res.render('executiveLogin')
})


router.post('/login', async (req, res) => {

const executive = await Executive.findOne({
    email: req.body.email,
    isActive: true
})

if (!executive) {
    return res.send("Invalid Email or Password")
}

const valid =
await bcrypt.compare(
    req.body.password,
    executive.password
)

if (!valid) {
    return res.send("Invalid Email or Password")
}

req.session.executiveId = executive._id
req.session.executiveName = executive.name
req.session.tenantId = executive.tenantId


    // --- AUTO CAPTURE LOGIN TIME ---
    const today = new Date().toISOString().slice(0,10)

    let record = await ExecutiveAttendance.findOne({
        executiveId: executive._id,
        date: today
    })

if (record && !record.activityLog) {
    record.activityLog = []
}

const now = new Date().toLocaleTimeString()

if (!record) {

    record = new ExecutiveAttendance({
        tenantId: req.session.tenantId.toString(),
        executiveId: executive._id,
        executiveName: executive.name,
        date: today,
        loginTimes: [now],
        activityLog: []
    })

} else {

if (!record.loginTimes) {
    record.loginTimes = []
}

record.loginTimes.push(now)

    if (!record.activityLog) {
        record.activityLog = []
    }

}

record.activityLog.push({
    type: 'LOGIN',
    time: now
})

await record.save()

    res.redirect('/executive/dashboard')

})

router.get('/reports', async (req, res) => {

    if (!req.session.executiveId) {
        return res.redirect('/executive/login')
    }

    const today = new Date().toISOString().slice(0,10)

    const attendance = await ExecutiveAttendance.findOne({
        executiveId: req.session.executiveId,
        date: today
    })

    res.render('executiveReports', {
        attendance
    })

})

const Buyer = require('../models/Buyer')

router.get('/dashboard', async (req, res) => {

    if (!req.session.executiveId) {
        return res.redirect('/executive/login')
    }

    if (
        req.session.unlockTime &&
        (
            new Date() - new Date(req.session.unlockTime)
        ) > CONTACT_UNLOCK_TIMEOUT
    ) {
        req.session.unlockedBuyerId = null
        req.session.unlockTime = null
    }

const executive = await Executive.findById(
    req.session.executiveId
)

const buyers = await Buyer.find({
    tenantId: req.session.tenantId,
    $or: [

        // Explicit admin assignment
        {
            assignedExecutiveId: req.session.executiveId
        },

        // Auto area allocation
        {
            assignedExecutiveId: null,
            preferredLocations: {
                $in: executive.assignedLocations
            }
        }

    ]
})

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


const contacted = await Buyer.countDocuments({
    assignedExecutiveId: req.session.executiveId,
    status: 'Contacted'
})

const negotiation = await Buyer.countDocuments({
    assignedExecutiveId: req.session.executiveId,
    status: 'Negotiation'
})

const today = new Date().toISOString().slice(0,10)

const attendance = await ExecutiveAttendance.findOne({
    executiveId: req.session.executiveId,
    date: today
})


const currentStatus =
attendance?.siteVisitOut?.length >
attendance?.siteVisitIn?.length
? 'SITE VISIT'
: 'ACTIVE'


const startOfDay = new Date()

startOfDay.setHours(0,0,0,0)

const endOfDay = new Date(startOfDay)

endOfDay.setDate(endOfDay.getDate() + 1)

const myLeads = buyers.length

const openBuyers = buyers.filter(b =>
    b.status !== 'Deal Closed' &&
    b.status !== 'Lost'
)

const openLeadCount = openBuyers.length

const pipelineValue = openBuyers.reduce(
    (total,buyer) => {

        const avg =
        (
            Number(buyer.minBudget || 0) +
            Number(buyer.maxBudget || 0)
        ) / 2

        return total + avg

    },
    0
)

const followUps = await Buyer.countDocuments({
    assignedExecutiveId: req.session.executiveId,

    nextFollowUp: {
        $gte: startOfDay,
        $lt: endOfDay
    },

    status: {
        $nin: ['Deal Closed','Lost']
    }
})

const todayVisits = await BuyerProjectVisit.find({
    executiveId: req.session.executiveId,
    scheduledVisitDate: {
        $gte: startOfDay,
        $lt: endOfDay
    }
})
.populate({
    path:'buyerId',
    match:{
        status:{
            $nin:['Deal Closed','Lost']
        }
    }
})

const siteVisits =
    todayVisits.filter(v => v.buyerId).length


const closedDeals = await Buyer.countDocuments({
    assignedExecutiveId: req.session.executiveId,
    status: 'Deal Closed'
})

const lost = await Buyer.countDocuments({
    assignedExecutiveId: req.session.executiveId,
    status: 'Lost'
})

const teaOutCount = attendance?.teaOut?.length || 0
const teaInCount = attendance?.teaIn?.length || 0
const teaActive = teaOutCount > teaInCount

const lunchOutCount = attendance?.lunchOut?.length || 0
const lunchInCount = attendance?.lunchIn?.length || 0
const lunchActive = lunchOutCount > lunchInCount

const meetingOutCount = attendance?.meetingOut?.length || 0
const meetingInCount = attendance?.meetingIn?.length || 0
const meetingActive = meetingOutCount > meetingInCount

const siteOutCount = attendance?.siteVisitOut?.length || 0
const siteInCount = attendance?.siteVisitIn?.length || 0
const siteActive = siteOutCount > siteInCount

const lastLogin =
    attendance?.loginTimes?.slice(-1)[0]

const lastLogout =
    attendance?.logoutTimes?.slice(-1)[0]

let displayLogoutTime = lastLogout

if (lastLogin && lastLogout) {

    const login = new Date(`1970-01-01 ${lastLogin}`)
    const logout = new Date(`1970-01-01 ${lastLogout}`)

    if (login > logout) {
        displayLogoutTime = null
    }
}

const currentlyBusy =
    teaActive ||
    lunchActive ||
    meetingActive ||
    siteActive

const lunchCompleted =
    (attendance?.lunchOut?.length || 0) >= 1 &&
    (attendance?.lunchIn?.length || 0) >= 1

res.render('executiveMyDashboard', {
    buyers,
    executiveName: req.session.executiveName,
    unlockedBuyerId: req.session.unlockedBuyerId || null,
    contactUnlockTimeout: CONTACT_UNLOCK_TIMEOUT,
    attendance,
    myLeads,
    followUps,
    siteVisits,
    closedDeals,
    lost,
    currentStatus,
teaOutCount,
teaActive,

lunchOutCount,
lunchActive,

meetingOutCount,
meetingActive,

siteOutCount,
siteActive,

contacted,
negotiation,

openLeadCount,

openBuyers,

currentlyBusy,

lunchCompleted,

displayLogoutTime,

pipelineValue,

closedValue:
closedValue[0]?.total || 0,

lostValue:
lostValue[0]?.total || 0

})

})


router.get('/edit/:id', async (req, res) => {

const executive = await Executive.findById(req.params.id)

    const locations = await LocationMaster.find({})
        .sort({ officeName: 1 })

    if (!executive) {
        return res.send('Executive not found')
    }

    res.render('editExecutive', {
        executive,
        locations,
    error: req.query.error || null
    })

})

router.post('/update/:id', async (req, res) => {

    let assignedLocations = req.body.assignedLocations || []

    if (!Array.isArray(assignedLocations)) {
        assignedLocations = [assignedLocations]
    }

const duplicateLocation = await Executive.findOne({
    tenantId: req.session.tenantId,
    assignedLocations: { $in: assignedLocations },
    _id: { $ne: req.params.id }
})

if (duplicateLocation) {

    const clashLocation = assignedLocations.find(loc =>
        duplicateLocation.assignedLocations.includes(loc)
    )

    return res.redirect(
        `/executive/edit/${req.params.id}?error=` +
        encodeURIComponent(
            `${clashLocation} is already assigned to ${duplicateLocation.name}`
        )
    )
}

await Executive.findByIdAndUpdate(
    req.params.id,
    {
        name: req.body.name,
        mobile: req.body.mobile,
        email: req.body.email,
        password: req.body.password
    ? await bcrypt.hash(req.body.password, 10)
    : (await Executive.findById(req.params.id)).password,
        assignedLocations: assignedLocations,
        dateOfJoining: req.body.dateOfJoining || "",
        dateOfLeaving: req.body.dateOfLeaving || ""
    }
)

    res.redirect('/executive/list')

})

router.get('/delete/:id', async (req, res) => {

await Executive.findByIdAndDelete(req.params.id)

    res.redirect('/executive/list')

})

router.post('/attendance/punch', async (req, res) => {

    if (!req.session.executiveId) {
        return res.redirect('/executive/login')
    }

    const today = new Date().toISOString().slice(0,10)

    let record = await ExecutiveAttendance.findOne({
        executiveId: req.session.executiveId,
        date: today
    })

if (!record) {

    record = new ExecutiveAttendance({
        tenantId: req.session.tenantId,
        executiveId: req.session.executiveId,
        executiveName: req.session.executiveName,
        date: today,
        activityLog: []
    })

}

    const { type } = req.body

    // Auto-capture first login
    if (!record.loginTime) {
        record.loginTime = new Date().toLocaleTimeString()
    }

    const time = new Date().toLocaleTimeString()

    const teaActive =
        (record.teaOut?.length || 0) >
        (record.teaIn?.length || 0)

    const lunchActive =
        (record.lunchOut?.length || 0) >
        (record.lunchIn?.length || 0)

    const meetingActive =
        (record.meetingOut?.length || 0) >
        (record.meetingIn?.length || 0)

    const siteActive =
        (record.siteVisitOut?.length || 0) >
        (record.siteVisitIn?.length || 0)

    const currentlyBusy =
        teaActive ||
        lunchActive ||
        meetingActive ||
        siteActive

    const outActions = [
        'teaOut',
        'lunchOut',
        'meetingOut',
        'siteVisitOut'
    ]

    // Block starting another activity while one is active
    if (currentlyBusy && outActions.includes(type)) {
        return res.redirect('/executive/dashboard')
    }

    if (!record[type]) {
        record[type] = []
    }


if (
    type === 'lunchOut' &&
    (record.lunchOut?.length || 0) >= 1
) {
    return res.redirect('/executive/dashboard')
}

if (
    type === 'lunchIn' &&
    (record.lunchIn?.length || 0) >= 1
) {
    return res.redirect('/executive/dashboard')
}


    record[type].push(time)

    if (!record.activityLog) {
        record.activityLog = []
    }

    record.activityLog.push({
        action: type,
        time: time
    })

    await record.save()

    res.redirect('/executive/dashboard')

})

router.get('/attendance-report', async (req, res) => {

    if (!req.session.executiveId) {
        return res.redirect('/executive/login')
    }

    const ExecutiveAttendance = require('../models/ExecutiveAttendance')

    const records = await ExecutiveAttendance.find({
        executiveId: req.session.executiveId
    }).sort({ date: -1 })

    res.render('executiveAttendanceReport', {
        records
    })

})

router.get('/followups', async (req,res)=>{

const today = new Date()
today.setHours(0,0,0,0)

const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)

const buyers = await Buyer.find({
    assignedExecutiveId: req.session.executiveId,
    nextFollowUp:{
        $gte: today,
        $lt: tomorrow
    }
})

res.render('executiveFollowUps',{
    buyers
})

})

router.get('/sitevisits', async (req,res)=>{

const today = new Date()
today.setHours(0,0,0,0)

const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)

const visits = await BuyerProjectVisit.find({
    executiveId: req.session.executiveId,
    scheduledVisitDate:{
        $gte: today,
        $lt: tomorrow
    }
})
.populate({
    path:'buyerId',
    match:{
        status:{
            $nin:['Deal Closed','Lost']
        }
    }
})

const filteredVisits = visits.filter(v => v.buyerId)

res.render('executiveSiteVisits',{
    visits: filteredVisits
})

})

router.get('/deals', async (req,res)=>{

const buyers = await Buyer.find({
    assignedExecutiveId: req.session.executiveId,
    status:'Deal Closed'
})

res.render('executiveDeals',{
    buyers
})

})

router.get('/lost', async (req,res)=>{

const buyers = await Buyer.find({
    assignedExecutiveId: req.session.executiveId,
    status:'Lost'
})

res.render('executiveLost',{
    buyers
})

})


router.get('/logout', async (req, res) => {

    const today = new Date().toISOString().slice(0,10)

    let record = await ExecutiveAttendance.findOne({
        executiveId: req.session.executiveId,
        date: today
    })

    if (record) {

        const currentTime = new Date().toLocaleTimeString()

    if (!record.logoutTimes) {
    record.logoutTimes = []
}

record.logoutTimes.push(currentTime)

        if (!record.activityLog) {
            record.activityLog = []
        }

        record.activityLog.push({
            type: 'LOGOUT',
            time: currentTime
        })

        await record.save()
    }

    delete req.session.executiveId
    delete req.session.executiveName

    res.redirect('/executive/login')

})


module.exports = router
