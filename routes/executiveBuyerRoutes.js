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

const {
    notifyExecutive
} = require('../services/notificationService');

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
'/unqualified',
isLoggedIn,
async (req,res)=>{

const search = req.query.search || ''

const status = req.query.status || ''

const transactionType =
req.query.transactionType || ''

let filter = {
    tenantId: req.session.tenantId,
    currentOwnerRole: "PreSales",
    leadSource: "Excel",
    assignedExecutiveId: req.session.executiveId
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

const explain = await Buyer.find(filter)
.sort({ createdAt: -1 })
.explain("executionStats");

const buyers = await Buyer.find(filter)
.sort({ createdAt: -1 })
.lean();

const buyerIds = buyers.map(b => b._id);

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
    newLeads,
    contacted,
    siteVisits,
    negotiations,
    closedDeals,
    lostDeals
] = await Promise.all([


Buyer.countDocuments({
    tenantId: req.session.tenantId,
    currentOwnerRole: "PreSales",
    leadSource: "Excel",
    assignedExecutiveId: req.session.executiveId,
    status: "New Lead"
}),

Buyer.countDocuments({
    tenantId: req.session.tenantId,
    currentOwnerRole: "PreSales",
    leadSource: "Excel",
    assignedExecutiveId: req.session.executiveId,
    status: "Contacted"
}),

Buyer.countDocuments({
    tenantId: req.session.tenantId,
    currentOwnerRole: "PreSales",
    leadSource: "Excel",
    assignedExecutiveId: req.session.executiveId,
    status: "Site Visit"
}),

Buyer.countDocuments({
    tenantId: req.session.tenantId,
    currentOwnerRole: "PreSales",
    leadSource: "Excel",
    assignedExecutiveId: req.session.executiveId,
    status: "Negotiation"
}),

Buyer.countDocuments({
    tenantId: req.session.tenantId,
    currentOwnerRole: "PreSales",
    leadSource: "Excel",
    assignedExecutiveId: req.session.executiveId,
    status: "Deal Closed"
}),

Buyer.countDocuments({
    tenantId: req.session.tenantId,
    currentOwnerRole: "PreSales",
    leadSource: "Excel",
    assignedExecutiveId: req.session.executiveId,
    status: "Lost"
}),

]);

res.render('executiveUnqualifiedBuyers', {
    buyers,
    transactionType,
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

router.post('/status-unqualified/:id', isLoggedIn, async (req, res) => {

await Buyer.findOneAndUpdate(
{
    _id: req.params.id,
    tenantId: req.session.tenantId,
    assignedExecutiveId: req.session.executiveId
},
{
    status: req.body.status
}
);

    res.redirect('/executive/unqualified');
});

router.post(
    '/status-unqualified-drag/:id',
    isLoggedIn,
    async (req, res) => {

        try {

await Buyer.findOneAndUpdate(
{
    _id: req.params.id,
    tenantId: req.session.tenantId,
    assignedExecutiveId: req.session.executiveId
},
                {
                    status: req.body.status
                }
            );

            res.json({
                success: true
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false,
                message: "Unable to update status."
            });

        }

    }
);

router.post(
'/reassign-unqualified/:id',
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
    tenantId: req.session.tenantId,
    assignedExecutiveId: req.session.executiveId
},
{
    assignedExecutiveId: executive._id,
    assignedExecutiveName: executive.name,
    assignmentType: "MANUAL"
}
)

const buyer = await Buyer.findById(
    req.params.id
);

await notifyExecutive(

    executive,

    `Lead Reassigned

Name: ${buyer.name}
Mobile: ${buyer.phone}

This lead has been assigned to you.`

);

res.redirect('/executive/unqualified')

})

router.post(
'/update-unqualified/:id',
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

transactionType:
req.body.transactionType,

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

    buyerNotes: req.body.buyerNotes,

    status: req.body.status,
    followUpNotes: req.body.followUpNotes
}
)

res.redirect('/executive/unqualified')

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
    '/edit-unqualified/:id',
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

    res.render('editUnqualifiedBuyer', {
        buyer,
        locations
    })

})



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

router.get(
    '/bulk-upload-unqualified',
    isLoggedIn,
    isAdmin,
    (req,res)=>{
        res.render('unqualifiedLeadBulkUpload');
    }
);

router.post(
    '/bulk-upload-unqualified',
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

            await Buyer.create({

tenantId: req.session.tenantId,

name: row.Name,

phone: String(row.Phone),

email: row.Email,

status: "Imported",

leadSource: "Excel",

currentOwnerRole: "PreSales",

createdByRole: "Admin",

assignedExecutiveId: null,

assignedExecutiveName: "",

primaryLocation: primaryLocation,

preferredLocations: locationData.map(l=>l.officeName),

preferredPincodes,

preferredDistricts,

preferredDivisionNames,

stateName,

preferredLocation:{
    type:"Point",
    coordinates:[
        buyerLng,
        buyerLat
    ]
}

});

            importedCount++

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

        'kbalki2k15@gmail.com',

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

module.exports = router