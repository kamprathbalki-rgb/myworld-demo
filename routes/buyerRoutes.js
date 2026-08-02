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
const { sendWhatsApp } = require('../services/whatsappService')
const BuyerProjectVisit = require('../models/BuyerProjectVisit')
const {appendBuyerTimeline} = require('./buyerTimelineRoutes');

const {notifyExecutive} = require('../services/notificationService');

const XLSX = require('xlsx')

const multer = require('multer')

const { sendEmail } =
require('../utils/emailService')

const Tenant =
require('../models/Tenant')

const uploadExcel = multer({
    storage: multer.memoryStorage()
})

const WhatsappGroup =
require('../models/WhatsappGroup');

const clientManager =
require(
'../services/tenantWhatsapp/clientManager'
)

const {
    downloadCSV,
    downloadExcel,
    createCSVBuffer,
    createExcelBuffer
} = require("../services/bulkDownloadService");

const archiver = require("archiver");

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
        session: req.session,
        buyer,
        locations
    })

})

router.get(
'/delete/:id',
isLoggedIn,
isAdmin,
async (req, res) => {

const buyer = await Buyer.findOne({

    _id: req.params.id,

    tenantId: req.session.tenantId

});

if (!buyer) {

    return res.send("Buyer not found");

}

appendBuyerTimeline(

    buyer,

    req.session.user?.name ||
    req.session.executiveName,

    req.session.user
        ? 'Admin'
        : req.session.executiveType,

    'Buyer Deleted',

    buyer.status,

    'Deleted'

);

await Buyer.deleteOne({

    _id: buyer._id

});

res.redirect('/buyer/page');

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
session: req.session,
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

router.get(
    '/bulk-upload',
    isLoggedIn,
    isAdmin,
    (req, res) => {

        res.render(
            'buyerBulkUpload'
        )

    }
)

router.post(
    '/bulk-upload',
    isLoggedIn,
    isAdmin,
    uploadExcel.single('excelFile'),
    async (req, res) => {

        const workbook = XLSX.read(
            req.file.buffer,
            { type: 'buffer' }
        )

        const sheet =
            workbook.Sheets[
                workbook.SheetNames[0]
            ]

        const rows =
            XLSX.utils.sheet_to_json(
                sheet,
                { defval: '' }
            )

        let importedCount = 0
        let duplicateCount = 0
        let invalidCount = 0

        let duplicateMobiles = []
        let invalidRows = []
        let missingLocationRequests = []

        for (const row of rows) {

            if (
                !row.Phone ||
                !/^\d{10}$/.test(
                    String(row.Phone)
                )
            ) {

                invalidCount++

                invalidRows.push(
                    row.Name || 'Unknown'
                )

                continue
            }

            const existingBuyer =
                await Buyer.findOne({

                    tenantId:
                    req.session.tenantId,

                    phone:
                    String(row.Phone)

                })

            if (existingBuyer) {

                duplicateCount++

                if (
                    !duplicateMobiles.includes(
                        String(row.Phone)
                    )
                ) {
                    duplicateMobiles.push(
                        String(row.Phone)
                    )
                }

                continue
            }

            let preferredLocations = [

                row['Preferred Location 1'],

                row['Preferred Location 2'],

                row['Preferred Location 3']

            ].filter(Boolean)

let locationData = []

const primaryLocationName =
    preferredLocations[0]

const primaryLocationRecord =
    await LocationMaster.findOne({

        officeName: {
            $regex: '^' + primaryLocationName,
            $options: 'i'
        }

    })

if (!primaryLocationRecord) {

    invalidCount++

    invalidRows.push(
        `${row.Name} - ${primaryLocationName}`
    )

    if (
        !missingLocationRequests.includes(
            primaryLocationName
        )
    ) {
        missingLocationRequests.push(
            primaryLocationName
        )
    }

    continue
}

locationData.push(
    primaryLocationRecord
)

for (const locationName of preferredLocations.slice(1)) {

    const location =
        await LocationMaster.findOne({

            officeName: {
                $regex: '^' + locationName,
                $options: 'i'
            }

        })

    if (location) {
        locationData.push(location)
    }

}


            const preferredPincodes = [
                ...new Set(
                    locationData.map(
                        l => l.pincode
                    )
                )
            ]

            const preferredDistricts = [
                ...new Set(
                    locationData.map(
                        l => l.district
                    )
                )
            ]

            const preferredDivisionNames = [
                ...new Set(
                    locationData.map(
                        l => l.divisionName
                    )
                )
            ]

            const stateName =
                locationData.length > 0
                ? locationData[0].stateName
                : ""

            const primaryLocation =
    primaryLocationRecord.officeName

const primaryLocationData =
    locationData[0]

const buyerLat =
Number(primaryLocationData?.lat) || 0

const buyerLng =
Number(primaryLocationData?.lng) || 0

const matchedExecutive =
    await Executive.findOne({
        tenantId: req.session.tenantId,
        executiveType: "PreSales",
        assignedLocations: primaryLocation,
        isActive: true
    })

            let requiredPossession =
                row['Required Possession']
                || []

            if (
                requiredPossession &&
                typeof requiredPossession ===
                'string'
            ) {

                requiredPossession =
                    requiredPossession
                    .split(',')
                    .map(x => x.trim())
                    .filter(Boolean)

            }


const transactionType =
(
row.TransactionType ||
'SALE'
)
.toUpperCase();

if (
![
'SALE',
'RENT',
'LEASE'
]
.includes(transactionType)
) {

invalidCount++;

invalidRows.push(
`${row.Name} - Invalid Transaction Type`
);

continue;

}

const buyer = await Buyer.create({

    tenantId:
    req.session.tenantId,

    name:
    row.Name,

    phone:
    String(row.Phone),

    email:
    row.Email,

    minBudget:
    Number(row['Min Budget'] || 0),

    maxBudget:
    Number(row['Max Budget'] || 0),

    transactionType:
    transactionType,

    requiredPossession:
    requiredPossession,

    requiredFlatType:
    row['Required Flat Type'],

    minArea:
    Number(row['Min Area'] || 0),

    maxArea:
    Number(row['Max Area'] || 0),

    radius:
    Number(row['Radius'] || 0),

    assignmentType:
    "AUTO",

    primaryLocation:
    primaryLocation,

    preferredLocations:
    locationData.map(
        l => l.officeName
    ),

    preferredPincodes:
    preferredPincodes,

    preferredDistricts:
    preferredDistricts,

    preferredDivisionNames:
    preferredDivisionNames,

    stateName:
    stateName,

    assignedExecutiveId:
    matchedExecutive
        ? matchedExecutive._id
        : null,

    assignedExecutiveName:
    matchedExecutive
        ? matchedExecutive.name
        : "",

    preferredLocation: {

        type: "Point",

        coordinates: [
            buyerLng,
            buyerLat
        ]

    }

});

appendBuyerTimeline(

    buyer,

    req.session.user?.name ||
    'System',

    'System',

    'Buyer Imported',

    '',

    'Bulk Excel Upload'

);

importedCount++;

        }

        if (
            duplicateMobiles.length > 0
        ) {

            const tenant =
                await Tenant.findById(
                    req.session.tenantId
                )

            await sendEmail(

                tenant.adminEmail,

                'Buyer Upload Summary',

                `
                <h2>
                Buyer Upload Summary
                </h2>

                <p>
                Tenant:
                ${tenant?.name || ''}
                </p>

                <p>
                Duplicate Mobiles:
                </p>

                <pre>
${duplicateMobiles.join('\n')}
                </pre>
                `

            ).catch(console.error)

        }

if (missingLocationRequests.length > 0) {

    const tenant =
        await Tenant.findById(
            req.session.tenantId
        )

await sendEmail(

    process.env.ADMIN_EMAIL,

    'Buyer Upload - New Locations Requested',

    `
    <h2>Location Master Update Required</h2>

    <p>
    Tenant:
    ${tenant?.name || ''}
    </p>

    <pre>
${missingLocationRequests.join('\n')}
    </pre>
    `

).catch(console.error)

}

        res.render(
            'buyerBulkUploadResult',
            {
                importedCount,
                duplicateCount,
                invalidCount,
                duplicateMobiles,
                invalidRows
            }
        )

    }
)

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

const buyer = await Buyer.findOne({

    _id: req.params.id,
    tenantId: req.session.tenantId

});

const oldStatus = buyer.status || '';

const oldBudget =
`${buyer.minBudget} - ${buyer.maxBudget}`;

const oldExecutive =
buyer.assignedExecutiveName || '';

const oldLocation =
buyer.primaryLocation || '';


Object.assign(
    buyer,
    {

        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,

        minBudget: req.body.minBudget,
        maxBudget: req.body.maxBudget,

        transactionType:
        req.body.transactionType,

        requiredPossession:
        requiredPossession,

        requiredFlatType:
        requiredFlatType,

        minArea:
        minArea,

        maxArea:
        maxArea,

        radius:
        req.body.radius,

        preferredLocations:
        selectedLocations,

        primaryLocation:
        primaryLocation,

        preferredPincodes:
        preferredPincodes,

        preferredDistricts:
        preferredDistricts,

        preferredDivisionNames:
        preferredDivisionNames,

        stateName:
        stateName,

        preferredLocation: {

            type: "Point",

            coordinates: [

                parseFloat(req.body.lng) || 0,

                parseFloat(req.body.lat) || 0

            ]

        },

        buyerNotes:
        req.body.buyerNotes,

        status:
        req.body.status,

        followUpNotes:
        req.body.followUpNotes

    }

);

await buyer.save();

appendBuyerTimeline(

    buyer,

    req.session.user?.name ||
    req.session.executiveName,

    req.session.user
        ? 'Admin'
        : req.session.executiveType,

    'Buyer Updated',

    `Status : ${oldStatus}
Budget : ${oldBudget}
Location : ${oldLocation}
Executive : ${oldExecutive}`,

    `Status : ${buyer.status}
Budget : ${buyer.minBudget} - ${buyer.maxBudget}
Location : ${buyer.primaryLocation}
Executive : ${buyer.assignedExecutiveName}`

);

res.redirect('/buyer/page')

})


router.post(
'/followup/:id',
isLoggedIn,
async (req,res)=>{

const buyer =
await Buyer.findById(req.params.id);

const oldFollowUp =
buyer.followUpNotes || '';

await Buyer.findByIdAndUpdate(

req.params.id,

{
nextFollowUp:
req.body.nextFollowUp
? new Date(req.body.nextFollowUp)
: null,

followUpNotes:
req.body.followUpNotes

}

);

appendBuyerTimeline(

buyer,

req.session.user?.name ||
req.session.executiveName,

req.session.user
? 'Admin'
: req.session.executiveType,

'Follow-up Updated',

oldFollowUp,

req.body.followUpNotes

);

res.redirect('/buyer/page');

});


router.post(
'/status/:id',
isLoggedIn,
async (req,res)=>{

const buyer =
await Buyer.findById(req.params.id);

const oldStatus =
buyer.status || '';

buyer.status =
req.body.status;

await buyer.save();

appendBuyerTimeline(

buyer,

req.session.user?.name ||
req.session.executiveName,

req.session.user
? 'Admin'
: req.session.executiveType,

'Status Changed',

oldStatus,

buyer.status

);

res.redirect('/buyer/page');

});

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

const submittedLat =
parseFloat(req.body.lat)

const submittedLng =
parseFloat(req.body.lng)

const buyerLat =
Number.isFinite(submittedLat)
? submittedLat
: Number(primaryLocationData?.lat) || 0

const buyerLng =
Number.isFinite(submittedLng)
? submittedLng
: Number(primaryLocationData?.lng) || 0

const matchedExecutive =
    await Executive.findOne({
        tenantId: req.session.tenantId,
        executiveType: "PreSales",
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

transactionType:
req.body.transactionType,


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

    buyerNotes: req.body.buyerNotes,

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
        buyerLng,
        buyerLat
    ]
}

})

await buyer.save()

appendBuyerTimeline(

    buyer,

    req.session.user?.name ||
    req.session.executiveName,

    req.session.user
        ? 'Admin'
        : req.session.executiveType,

    'Buyer Created',

    '',

    'New Buyer Added'

);

await notifyExecutive(

    matchedExecutive,

    `New Lead Assigned

Name: ${buyer.name}
Mobile: ${buyer.phone}
Location: ${buyer.primaryLocation}`

);


if (matchedExecutive && matchedExecutive.mobile) {

    await sendWhatsApp(
        matchedExecutive.mobile,
        `New Lead Assigned

Name: ${buyer.name}
Mobile: ${buyer.phone}
Location: ${buyer.primaryLocation}`
    );

}

await sendWhatsApp(
    '9503728537',
    `New Buyer Lead

Name: ${buyer.name}
Mobile: ${buyer.phone}
Location: ${buyer.primaryLocation}
Executive: ${buyer.assignedExecutiveName || 'Not Assigned'}`
)

res.redirect('/buyer/page')

})

router.get(
'/add',
isLoggedIn,
async (req, res) => {

const locations = await LocationMaster.find({})
.sort({ officeName: 1 })

res.render('addBuyer', {
session: req.session,
locations
})

})


router.get(
'/page',
isLoggedIn,
async (req,res)=>{

const routeStart = Date.now();

const search = req.query.search || ''

const status = req.query.status || ''

const transactionType =
req.query.transactionType || ''

let filter = {
    tenantId: req.session.tenantId,
    leadSource: { $ne: "Excel" },
    currentOwnerRole: { $ne: "PreSales" }
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

if(transactionType){

    filter.transactionType =
    transactionType

}

const buyers = await Buyer.find(filter)
.sort({ createdAt: -1 })
.lean();

const explain = await Buyer.find(filter)
.sort({ createdAt: -1 })
.explain("executionStats");


const buyerIds = buyers.map(b => b._id);

const properties = await Property.find({
    tenantId: req.session.tenantId
}).lean();


const normalize = value =>
    String(value || "")
        .toUpperCase()
        .replace(/\b(B\.?O\.?|S\.?O\.?|H\.?O\.?|G\.?P\.?O\.?)\b/g, "")
        .replace(/[^A-Z0-9 ]/g, "")
        .replace(/\s+/g, " ")
        .trim();


for (const buyer of buyers) {

    let matchCount = 0;

    for (const property of properties) {

        const score = await calculateScore(property, buyer);

if (
    property.transactionType === buyer.transactionType &&
    (
        (property.propertyMode === "PROJECT" &&
            property.configurations.some(c =>
                c.flatType === buyer.requiredFlatType
            )) ||
        (property.propertyMode !== "PROJECT" &&
            property.singleFlatType === buyer.requiredFlatType)
    ) &&
    buyer.preferredLocations
        .map(normalize)
        .includes(
            normalize(
                property.propertyLocation || ""
            )
        )
) {
    matchCount++;
}

    }

    buyer.matchCount = matchCount;
}

const visits = await BuyerProjectVisit.find({
    buyerId: { $in: buyerIds }
})
.sort({
    updatedAt: -1
})
.lean();

const latestVisitMap = new Map();

for (const visit of visits) {

    const key = visit.buyerId.toString();

    if (!latestVisitMap.has(key)) {
        latestVisitMap.set(key, visit);
    }

}

for (const buyer of buyers) {

    const latestVisit =
        latestVisitMap.get(buyer._id.toString());

    buyer.latestVisitStatus =
        latestVisit
            ? latestVisit.visitType
            : 'No Visit';

    buyer.lastActivity =
        latestVisit
            ? latestVisit.updatedAt
            : null;

}

const [
    executives,
    newLeads,
    contacted,
    siteVisits,
    negotiations,
    closedDeals,
    lostDeals
] = await Promise.all([

Executive.find({
    tenantId: req.session.tenantId,
    executiveType: "Sales",
    isActive: true
}).lean(),

    Buyer.countDocuments({
        tenantId: req.session.tenantId,
        status: 'New Lead'
    }),

    Buyer.countDocuments({
        tenantId: req.session.tenantId,
        status: 'Contacted'
    }),

    Buyer.countDocuments({
        tenantId: req.session.tenantId,
        status: 'Site Visit'
    }),

    Buyer.countDocuments({
        tenantId: req.session.tenantId,
        status: 'Negotiation'
    }),

    Buyer.countDocuments({
        tenantId: req.session.tenantId,
        status: 'Deal Closed'
    }),

    Buyer.countDocuments({
        tenantId: req.session.tenantId,
        status: 'Lost'
    })

]);

res.render('buyers', {
    session: req.session,
    buyers,
    transactionType,
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

appendBuyerTimeline(

    buyer,

    req.session.user?.name ||
    req.session.executiveName,

    req.session.user
        ? 'Admin'
        : req.session.executiveType,

    'Project Visit',

    '',

    `${req.body.visitType} - ${property.projectName}`

);

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

const buyer = await Buyer.findOne({

    _id: req.params.id,

    tenantId: req.session.tenantId

});

const oldExecutive =
buyer.assignedExecutiveName || 'Not Assigned';


if (!executive) {
    return res.send("Executive not found")
}

buyer.assignedExecutiveId = executive._id;

buyer.assignedExecutiveName = executive.name;

buyer.assignmentType = "MANUAL";

await buyer.save();

appendBuyerTimeline(

    buyer,

    req.session.user?.name ||
    req.session.executiveName,

    req.session.user
        ? 'Admin'
        : req.session.executiveType,

    'Executive Reassigned',

    oldExecutive,

    executive.name

);


await notifyExecutive(

    executive,

    `Lead Reassigned

Name: ${buyer.name}
Mobile: ${buyer.phone}

This lead has been assigned to you.`

);

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

tenantId:
req.session.tenantId,

transactionType:
buyer.transactionType || 'SALE'

})


const normalize = value =>
    String(value || "")
        .toUpperCase()
        .replace(/\b(B\.?O\.?|S\.?O\.?|H\.?O\.?|G\.?P\.?O\.?)\b/g, "")
        .replace(/[^A-Z0-9 ]/g, "")
        .replace(/\s+/g, " ")
        .trim();

let results = []

for (const property of properties) {

let matchedConfig = null;

if (property.propertyMode === "PROJECT") {

    matchedConfig = property.configurations.find(c =>
        c.flatType === buyer.requiredFlatType
    );

    if (!matchedConfig) {
        continue;
    }

} else {

    if (property.singleFlatType !== buyer.requiredFlatType) {
        continue;
    }

}

const buyerLocations = (buyer.preferredLocations || [])
    .map(normalize);

const propertyLocation = normalize(
    property.propertyLocation || ""
);

if (
    buyerLocations.length &&
    !buyerLocations.includes(propertyLocation)
) {
    continue;
}

    const score = await calculateScore(property, buyer);

    results.push({
        property,
        matchedConfig,
        score
    });

}

results.sort((a, b) => b.score - a.score);

const BuyerProjectVisit = require('../models/BuyerProjectVisit')

const visits = await BuyerProjectVisit.find({
    buyerId: buyer._id
})

res.render('matches', {
session: req.session,
buyer,
matches: results.slice(0, 10),
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

tenantId:
req.session.tenantId,

transactionType:
buyer.transactionType || 'SALE'

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

router.get(
'/whatsapp-groups',
isLoggedIn,
isAdmin,
async (req, res) => {

try {

const client =
clientManager[
req.session.tenantId
]

if (!client) {

return res.send(
'WhatsApp not connected. Please connect WhatsApp first.'
)

}

let chats = []

try {

    chats = await Promise.race([

        client.getChats().catch(() => []),

        new Promise((_, reject) =>
            setTimeout(
                () => reject(
                    new Error('getChats timeout')
                ),
                15000
            )
        )

    ])

} catch (err) {

    console.log(
        'GET CHATS ERROR:',
        err.message
    )

    return res.send(
        'Unable to load WhatsApp groups. Please try again.'
    )

}

    const groups =
    chats
    .filter(c => c.isGroup)
    .map(c => ({
        groupId: c.id._serialized,
        groupName: c.name
    }));

    const selectedGroups =
    await WhatsappGroup.find({
        tenantId: req.session.tenantId
    });

    res.render(
        'whatsappGroups',
        {
            groups,
            selectedGroups,
            saved: req.query.saved
        }
    );

} catch (err) {

    console.error(err);

    return res.send(
        'WhatsApp is reconnecting. Please refresh in 10 seconds.'
    );

}

});

router.post(
'/whatsapp-groups',
isLoggedIn,
isAdmin,
async (req, res) => {

    await WhatsappGroup.deleteMany({
        tenantId: req.session.tenantId
    });

    let groups =
    req.body.groups || [];

    if (!Array.isArray(groups)) {
        groups = [groups];
    }

    for (const item of groups) {

        const [
            groupId,
            groupName
        ] = item.split('|');

        await WhatsappGroup.create({

            tenantId:
            req.session.tenantId,

            groupId,

            groupName,

            active: true

        });

    }

const savedGroups =
await WhatsappGroup.find({
    tenantId: req.session.tenantId
});

res.redirect(
    '/buyer/whatsapp-groups?saved=1'
);

});


router.get(
'/broadcasts',
isLoggedIn,
isAdmin,
async (req,res)=>{

const WhatsappBroadcast =
require('../models/WhatsappBroadcast');

const broadcasts =
await WhatsappBroadcast.find()
.sort({ createdAt:-1 })
.limit(500);

res.render(
    'broadcasts',
    {
        broadcasts
    }
);

});

router.get(
    "/export/csv",
    isLoggedIn,
    isAdmin,
    async (req, res) => {

        const buyers =
        await Buyer.find({
            tenantId: req.session.tenantId
        }).lean();

        downloadCSV(
            res,
            buyers,
            `buyers-${new Date().toISOString().slice(0,10)}`
        );

    }
);

router.get(
    "/export/excel",
    isLoggedIn,
    isAdmin,
    async (req, res) => {

        const buyers =
        await Buyer.find({
            tenantId: req.session.tenantId
        }).lean();

        downloadExcel(
            res,
            buyers,
            `buyers-${new Date().toISOString().slice(0,10)}`
        );

    }
);

router.get(
    "/export/all",
    isLoggedIn,
    isAdmin,
    async (req, res) => {

        const buyers = await Buyer.find({
            tenantId: req.session.tenantId
        }).lean();

        const properties = await Property.find({
            tenantId: req.session.tenantId
        }).lean();

        const archive = archiver("zip", {
            zlib: { level: 9 }
        });

        res.attachment(
            `MyWorld-Backup-${new Date().toISOString().slice(0,10)}.zip`
        );

        archive.pipe(res);

        archive.append(
            createCSVBuffer(properties),
            { name: "properties.csv" }
        );

        archive.append(
            createExcelBuffer(properties),
            { name: "properties.xlsx" }
        );

        archive.append(
            createCSVBuffer(buyers),
            { name: "buyers.csv" }
        );

        archive.append(
            createExcelBuffer(buyers),
            { name: "buyers.xlsx" }
        );

        archive.finalize();

    }
);

router.post(
    "/status-unqualified/:id",
    isLoggedIn,
    (req, res) => {

        res.redirect(
            307,
            `/executive/status-unqualified/${req.params.id}`
        );

    }
);

router.post(
    "/status-unqualified-drag/:id",
    isLoggedIn,
    (req, res) => {

        res.redirect(
            307,
            `/executive/status-unqualified-drag/${req.params.id}`
        );

    }
);




module.exports = router