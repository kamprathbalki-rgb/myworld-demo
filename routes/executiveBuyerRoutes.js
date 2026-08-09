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
const {mapBuyerExecutives} = require("../services/executiveMappingService");
const BuyerWorkflowHistory = require("../models/BuyerWorkflowHistory");
const { appendDailyLog } = require("../services/dailyLogService");

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

const buyer = await Buyer.findOne({

    _id: req.params.id,

    tenantId: req.session.tenantId

});

if (!buyer) {

    return res.send("Buyer not found");

}

appendBuyerTimeline(

    buyer,

    req.session.executiveName,

    "PreSales",

    "Buyer Deleted",

    buyer.status,

     "Status Changed",

    "Deleted"

);

appendDailyLog(

    req.session.tenantId,

    `${req.session.executiveName} : ${buyer.name} : ${previousStatus} → ${req.body.status}`

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

const isAdmin =
!req.session.executiveId;

let filter = {
    tenantId: req.session.tenantId,
    leadSource: "Excel",

    $or: [

        {
            department: "PreSales"
        },

        {
            department: "Sales",
            status: {
                $in: [
                    "Qualified",
                    "Contacted",
                    "Follow-Up",
                    "Site Visit",
                    "Negotiation"
                ]
            }
        }

    ]
};

if (req.session.executiveId) {
    filter.preSalesExecutiveId = req.session.executiveId;
}

if (search) {

    filter.$and = [
        {
            $or: [
                { department: "PreSales" },
                {
                    department: "Sales",
                    status: {
                        $in: [
                            "Qualified",
                            "Contacted",
                            "Follow-Up",
                            "Site Visit",
                            "Negotiation"
                        ]
                    }
                }
            ]
        },
        {
            $or: [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { primaryLocation: { $regex: search, $options: "i" } }
            ]
        }
    ];

    delete filter.$or;
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

console.log("Session Executive ID:", String(req.session.executiveId));
console.log("Filter:", filter);


const buyers = await Buyer.find(filter)
.sort({ createdAt: -1 })
.lean();

console.log("Buyer Count:", buyers.length);

if (buyers.length > 0) {
    console.log("First Buyer:", buyers[0].name);
}

buyers.sort((a, b) => {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const aWorkedToday =
        a.lastWorkedOn &&
        new Date(a.lastWorkedOn) >= today;

    const bWorkedToday =
        b.lastWorkedOn &&
        new Date(b.lastWorkedOn) >= today;

    if (aWorkedToday !== bWorkedToday) {
        return aWorkedToday ? 1 : -1;
    }

    return new Date(b.createdAt) - new Date(a.createdAt);

});

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

const baseFilter = {
    tenantId: req.session.tenantId,
    department: "PreSales",
    leadSource: "Excel",
    preSalesExecutiveId: req.session.executiveId
};

const [
    executives,
    imported,
    phoneCall,
    qualified,
    contacted,
    followUp,
    siteVisit,
    negotiation,
    transaction,
    lost,
    notResponding
] = await Promise.all([

    Executive.find({
        tenantId: req.session.tenantId,
        executiveType: "PreSales",
        isActive: true
    }).lean(),

    Buyer.countDocuments({ ...baseFilter, status: "Imported" }),
    Buyer.countDocuments({ ...baseFilter, status: "Phone Call" }),
    Buyer.countDocuments({ ...baseFilter, status: "Qualified" }),
    Buyer.countDocuments({ ...baseFilter, status: "Contacted" }),
    Buyer.countDocuments({ ...baseFilter, status: "Follow-Up" }),
    Buyer.countDocuments({ ...baseFilter, status: "Site Visit" }),
    Buyer.countDocuments({ ...baseFilter, status: "Negotiation" }),
    Buyer.countDocuments({ ...baseFilter, status: "Transaction" }),
    Buyer.countDocuments({ ...baseFilter, status: "Lost" }),
    Buyer.countDocuments({ ...baseFilter, status: "Not Responding" })

]);

res.render("unqualifiedbuyers", {
    session: req.session,
    buyers,
    search,
    status,
    transactionType,
    executives,

    imported,
    phoneCall,
    qualified,
    contacted,
    followUp,
    siteVisit,
    negotiation,
    transaction,
    lost,
    notResponding
})

})

router.post('/status-unqualified/:id', isLoggedIn, async (req, res) => {

const buyer = await Buyer.findById(req.params.id);

if (!buyer) {
    return res.status(404).json({
        success: false,
        message: "Buyer not found."
    });
}

const previousStatus = buyer.status;

// -------------------------------
// Workflow Validation
// -------------------------------

const newStatus = req.body.status;

console.log("========== WORKFLOW VALIDATION ==========");
console.log("Buyer:", buyer.phone);
console.log("Previous Status:", previousStatus);
console.log("New Status:", newStatus);
console.log("nextFollowUp:", buyer.nextFollowUp);
console.log("siteVisitDate:", buyer.siteVisitDate);
console.log("buyerValue:", buyer.buyerValue);

if (
    previousStatus === "Phone Call" &&
    newStatus !== previousStatus &&
    newStatus === "Qualified"
) {

    if (!req.body.nextFollowUp) {
        return res.send(
            "Follow-up Date & Time is mandatory."
        );
    }

    if (new Date(req.body.nextFollowUp) < new Date()) {
        return res.send(
            "Follow-up Date & Time cannot be in the past."
        );
    }

}

if (
    previousStatus === "Qualified" &&
    newStatus === "Site Visit"
) {

    if (!req.body.siteVisitDate) {
        return res.send(
            "Site Visit Date & Time is mandatory."
        );
    }

    if (new Date(req.body.siteVisitDate) < new Date()) {
        return res.send(
            "Site Visit Date & Time cannot be in the past."
        );
    }

}


if (
    previousStatus === "Site Visit" &&
    newStatus === "Negotiation"
) {

    if (!req.body.nextFollowUp) {
        return res.send(
            "Follow-up Date & Time is mandatory."
        );
    }

    if (new Date(req.body.nextFollowUp) < new Date()) {
        return res.send(
            "Follow-up Date & Time cannot be in the past."
        );
    }

    if ((Number(req.body.buyerValue) || 0) <= 0) {
        return res.send(
            "Buyer Value must be greater than zero."
        );
    }

}


if (
    previousStatus === "Negotiation" &&
    ["Deal Won", "Lost"].includes(req.body.status)
) {

const finalBuyerValue = Number(req.body.buyerValue);

if (!finalBuyerValue || finalBuyerValue <= 0) {
    return res.status(400).json({
        success: false,
        message: "Please confirm the Final Buyer Value before closing the deal."
    });
}

await Buyer.updateOne(
    { _id: buyer._id },
    {
        $set: {
            buyerValue: finalBuyerValue
        }
    }
);

}

const confirmedBy = "Admin";

await Buyer.findOneAndUpdate(
{
    _id: req.params.id,
    tenantId: req.session.tenantId
},
{
    status: req.body.status,

    negotiationStatus: req.body.negotiationStatus,

    lastFollowUp: buyer.nextFollowUp,

    nextFollowUp: req.body.nextFollowUp
        ? new Date(req.body.nextFollowUp)
        : buyer.nextFollowUp,

    lastSiteVisitDate: buyer.siteVisitDate,

    siteVisitDate: req.body.siteVisitDate
        ? new Date(req.body.siteVisitDate)
        : buyer.siteVisitDate,

    buyerValue: req.body.buyerValue
        ? Number(req.body.buyerValue)
        : buyer.buyerValue,

    buyerValueConfirmedBy: confirmedBy,

    buyerValueConfirmedAt: new Date()
}
);


await BuyerWorkflowHistory.create({

    buyerId: buyer._id,

    tenantId: buyer.tenantId,

changedById:
    req.session.executiveId || req.session.user?._id,

changedByName:
    req.session.executiveName || req.session.user?.name,

changedByRole:
    req.session.executiveId ? "Executive" : "Admin",

    previousStatus,

    newStatus,

    changedAt: new Date()

});

const verifyBuyer = await Buyer.findById(req.params.id);

const updatedBuyer = await Buyer.findById(req.params.id);

appendBuyerTimeline(
    buyer,
    "PreSales",
    "Status Changed",
    previousStatus,
    req.body.status
);

appendBuyerTimeline(
    buyer,
    confirmedBy,
    "PreSales",
    "Final Buyer Value Confirmed",
    `₹${buyer.buyerValue}`,
    req.body.status
);

    res.redirect('/executive/unqualified');
});

router.post(
    '/status-unqualified-drag/:id',
    isLoggedIn,
    async (req, res) => {

        try {

            const buyer = await Buyer.findOne({
                _id: req.params.id,
                tenantId: req.session.tenantId,
                preSalesExecutiveId: req.session.executiveId
            });

            if (!buyer) {
                return res.status(404).json({
                    success: false,
                    message: "Buyer not found"
                });
            }

            const previousStatus = buyer.status;

// -------------------------------
// Workflow Validation
// -------------------------------

const newStatus = req.body.status;

console.log("========== WORKFLOW DRAG VALIDATION ==========");
console.log("Buyer:", buyer.phone);
console.log("Previous Status:", previousStatus);
console.log("New Status:", newStatus);
console.log("nextFollowUp:", buyer.nextFollowUp);
console.log("siteVisitDate:", buyer.siteVisitDate);
console.log("buyerValue:", buyer.buyerValue);

if (
    previousStatus === "Phone Call" &&
    newStatus !== previousStatus &&
    newStatus === "Qualified"
) {

    if (!req.body.nextFollowUp) {
        return res.send(
            "Follow-up Date & Time is mandatory."
        );
    }

    if (new Date(req.body.nextFollowUp) < new Date()) {
        return res.send(
            "Follow-up Date & Time cannot be in the past."
        );
    }

}

if (
    previousStatus === "Qualified" &&
    newStatus === "Site Visit"
) {

    if (!req.body.siteVisitDate) {
        return res.send(
            "Site Visit Date & Time is mandatory."
        );
    }

    if (new Date(req.body.siteVisitDate) < new Date()) {
        return res.send(
            "Site Visit Date & Time cannot be in the past."
        );
    }

}


if (
    previousStatus === "Site Visit" &&
    newStatus === "Negotiation"
) {

    if (!req.body.nextFollowUp) {
        return res.send(
            "Follow-up Date & Time is mandatory."
        );
    }

    if (new Date(req.body.nextFollowUp) < new Date()) {
        return res.send(
            "Follow-up Date & Time cannot be in the past."
        );
    }

    if ((Number(req.body.buyerValue) || 0) <= 0) {
        return res.send(
            "Buyer Value must be greater than zero."
        );
    }

}

            if (
                previousStatus === "Negotiation" &&
                ["Deal Won", "Lost", "Dropped"].includes(req.body.status)
            ) {
                return res.json({
                    success: false,
                    requireBuyerValueConfirmation: true
                });
            }

            await Buyer.findOneAndUpdate(
{
    _id: req.params.id,
    tenantId: req.session.tenantId
},
                {
                    status: req.body.status
                }
            );


await BuyerWorkflowHistory.create({

    buyerId: buyer._id,

    tenantId: buyer.tenantId,

changedById:
    req.session.executiveId || req.session.user?._id,

changedByName:
    req.session.executiveName || req.session.user?.name,

changedByRole:
    req.session.executiveId ? "Executive" : "Admin",

    previousStatus,

    newStatus,

    changedAt: new Date()

});

const verifyBuyer = await Buyer.findById(req.params.id);

            appendBuyerTimeline(
                buyer,
                req.session.executiveName,
                "PreSales",
                "Status Changed",
                previousStatus,
                req.body.status
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

const executive = await Executive.findOne({
    _id: req.body.executiveId,
    tenantId: req.session.tenantId
})

if (!executive) {
    return res.send("Executive not found")
}

const buyer = await Buyer.findById(
    req.params.id
);


appendBuyerTimeline(
    buyer,
    req.session.executiveName,
    "Admin",
    "Executive Reassigned",
    buyer.preSalesExecutiveName,
    executive.name
);

await Buyer.findOneAndUpdate(
{
    _id: req.params.id,
    tenantId: req.session.tenantId
},
{
    preSalesExecutiveId: executive._id,
    preSalesExecutiveName: executive.name,
    assignmentType: "MANUAL"
}
)

await notifyExecutive(

    executive,

    `Lead Reassigned

Name: ${buyer.name}
Mobile: ${buyer.phone}

This lead has been assigned to you.`

);

buyer.preSalesExecutiveId = executive._id;
buyer.preSalesExecutiveName = executive.name;

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

const buyer = await Buyer.findById(
    req.params.id
);

const previousStatus = buyer.status;
let status = req.body.status;
let qualificationDate = buyer.qualificationDate;

console.log("========== EDIT WORKFLOW ==========");
console.log("Buyer:", buyer.phone);
console.log("Previous:", previousStatus);
console.log("Requested:", status);
console.log("nextFollowUp:", req.body.nextFollowUp);
console.log("siteVisitDate:", req.body.siteVisitDate);
console.log("buyerValue:", req.body.buyerValue);
console.log("negotiationStatus:", req.body.negotiationStatus);


if (
    req.body.buyingInterest === "Yes" &&
    req.body.purchaseTimeline &&
    buyer.purchaseTimeline !== req.body.purchaseTimeline
) {
    qualificationDate = new Date();
}


// ======================================
// Workflow Validation (Edit Buyer)
// ======================================

const newStatus = req.body.status;

if (
    previousStatus === "Phone Call" &&
    newStatus !== previousStatus &&
    newStatus === "Qualified"
) {

    if (!req.body.nextFollowUp) {
        return res.send(
            "Next Follow-up Date & Time is mandatory."
        );
    }

    if (new Date(req.body.nextFollowUp) < new Date()) {
        return res.send(
            "Next Follow-up Date & Time cannot be in the past."
        );
    }

}

if (
    previousStatus === "Qualified" &&
    status === "Site Visit"
) {

    if (!req.body.siteVisitDate) {
        return res.send(
            "Site Visit Date & Time is mandatory."
        );
    }

    if (new Date(req.body.siteVisitDate) < new Date()) {
        return res.send(
            "Site Visit Date & Time cannot be in the past."
        );
    }

}

if (
    previousStatus === "Site Visit" &&
    status === "Negotiation"
) {

    if (!req.body.nextFollowUp) {
        return res.send(
            "Follow-up Date & Time is mandatory."
        );
    }

    if (new Date(req.body.nextFollowUp) < new Date()) {
        return res.send(
            "Follow-up Date & Time cannot be in the past."
        );
    }

    if ((Number(req.body.buyerValue) || 0) <= 0) {
        return res.send(
            "Buyer Value must be greater than zero."
        );
    }

}

let currentOwnerRole = buyer.currentOwnerRole;
let preSalesExecutiveId = buyer.preSalesExecutiveId;
let assignedExecutiveName = buyer.assignedExecutiveName;
let assignmentType = buyer.assignmentType;
let department = buyer.department || "PreSales";

let salesExecutiveId = buyer.salesExecutiveId || null;
let salesExecutiveName = buyer.salesExecutiveName || "";

const today = new Date();
today.setHours(0, 0, 0, 0);

if (req.body.buyingInterest === "Yes") {

    if (req.body.purchaseTimeline === "Immediate") {

        department = "Sales";
        currentOwnerRole = "Sales";

        if (
            req.body.siteVisitDate &&
            new Date(req.body.siteVisitDate) >= today
        ) {
            status = "Site Visit";
        } else {
            status = "Qualified";
        }

    } else if (req.body.purchaseTimeline === "1 Month") {

        status = "Qualified";
        department = "Sales";
        currentOwnerRole = "Sales";

    } else if (
        req.body.purchaseTimeline === "3 Months" ||
        req.body.purchaseTimeline === "6 Months" ||
        req.body.purchaseTimeline === "6+ Months"
    ) {

        department = "PreSales";
        status = "Future Prospects";

    }

} else if (req.body.buyingInterest === "No") {

    department = "PreSales";

    if (req.body.notInterestedReason === "Not Interested") {

        status = "Lost";

    } else {

        status = "Qualified - No Purchase";

    }

}

if (
    req.body.status === "Site Visit" ||
    req.body.status === "Negotiation" ||
    req.body.status === "Deal Won" ||
    req.body.status === "Lost"
) {
    status = req.body.status;
}


const executiveMapping =
    await mapBuyerExecutives(
        buyer.tenantId,
        primaryLocation
    );

const preSalesExecutiveName =
    executiveMapping.preSalesExecutiveName;

salesExecutiveId =
    executiveMapping.salesExecutiveId;

salesExecutiveName =
    executiveMapping.salesExecutiveName;

console.log("========== SAVING ==========");
console.log({
    status,
    nextFollowUp: req.body.nextFollowUp,
    siteVisitDate: req.body.siteVisitDate,
    buyerValue: req.body.buyerValue,
    negotiationStatus: req.body.negotiationStatus
});


await Buyer.findOneAndUpdate(
{
    _id: req.params.id,
    tenantId: req.session.tenantId,
},
{
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,

    whatsappNumber: req.body.isWhatsAppSame === "true"
        ? req.body.phone
        : req.body.whatsappNumber,

    isWhatsAppSame: req.body.isWhatsAppSame === "true",
    emailStatus: req.body.emailStatus,

buyingInterest: req.body.buyingInterest,
notInterestedReason: req.body.notInterestedReason,

purchaseTimeline: req.body.purchaseTimeline,
qualificationStatus: req.body.qualificationStatus,
siteVisitStatus: req.body.siteVisitStatus,
negotiationStatus: req.body.negotiationStatus,
qualificationDate: qualificationDate,

department: department,

salesExecutiveId: salesExecutiveId,
salesExecutiveName: salesExecutiveName,

preSalesExecutiveId: preSalesExecutiveId,
preSalesExecutiveName: preSalesExecutiveName,

salesExecutiveId: salesExecutiveId,
salesExecutiveName: salesExecutiveName,

    minBudget: req.body.minBudget,
    maxBudget: req.body.maxBudget,

buyerValue: req.body.buyerValue
    ? Number(req.body.buyerValue)
    : null,


    transactionType: req.body.transactionType,

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

    status: status,

    callStatus: req.body.callStatus || "",

    currentOwnerRole: currentOwnerRole,

lastFollowUp: buyer.nextFollowUp,

lastWorkedOn: new Date(),

nextFollowUp: req.body.nextFollowUp || null,

lastSiteVisitDate: buyer.siteVisitDate,

siteVisitDate: req.body.siteVisitDate || null,

    followUpNotes: req.body.followUpNotes
});

const savedBuyer = await Buyer.findById(req.params.id);

console.log("========== SAVED ==========");
console.log({
    status: savedBuyer.status,
    nextFollowUp: savedBuyer.nextFollowUp,
    siteVisitDate: savedBuyer.siteVisitDate,
    buyerValue: savedBuyer.buyerValue,
    negotiationStatus: savedBuyer.negotiationStatus
});


appendBuyerTimeline(

    buyer,

    req.session.executiveName,

    "PreSales",

    "Buyer Updated",

    previousStatus,

    req.body.status

);

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


module.exports = router