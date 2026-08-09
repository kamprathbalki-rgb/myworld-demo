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
const LeadWorkflow = require("../models/LeadWorkflow");

const XLSX = require('xlsx')
const multer = require('multer')
const { sendEmail } = require('../utils/emailService')
const Tenant = require('../models/Tenant')
const uploadExcel = multer({storage: multer.memoryStorage()})
const WhatsappGroup = require('../models/WhatsappGroup');
const clientManager = require('../services/tenantWhatsapp/clientManager')

const { appendDailyLog } = require("../services/dailyLogService");

const BuyerWorkflowHistory = require("../models/BuyerWorkflowHistory");

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

console.log("Unqualified Buyer Route GET Buyer:", {
    id: buyer._id,
    phone: buyer.phone,
    whatsappNumber: buyer.whatsappNumber,
    isWhatsAppSame: buyer.isWhatsAppSame,
    email: buyer.email,
    emailStatus: buyer.emailStatus
});

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
    leadSource: "Excel"
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
    currentOwnerRole: "PreSales",
    leadSource: "Excel"
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

    console.log("========== STATUS UPDATE START ==========");

    console.log("Route Hit");
    console.log("Buyer Id:", req.params.id);
    console.log("Session:", {
        tenantId: req.session.tenantId,
        adminName: req.session.adminName,
        executiveName: req.session.executiveName
    });

    console.log("Request Body:", req.body);

    const buyer = await Buyer.findById(req.params.id);

    console.log("Buyer Before Update:", {
        found: !!buyer,
        status: buyer?.status,
        buyerValue: buyer?.buyerValue,
        buyerValueConfirmedBy: buyer?.buyerValueConfirmedBy
    });

    if (!buyer) {
        console.log("Buyer not found.");
        return res.status(404).json({
            success: false,
            message: "Buyer not found."
        });
    }

    const previousStatus = buyer.status;

const newStatus = req.body.status;

    if (req.body.buyerValue) {
        buyer.buyerValue = Number(req.body.buyerValue);
        await buyer.save();
        console.log("Buyer Value Saved:", buyer.buyerValue);
    }

    if (
        previousStatus === "Negotiation" &&
        ["Deal Won", "Lost"].includes(req.body.status)
    ) {

        console.log("Closing Deal Validation");

        if (!buyer.buyerValue || buyer.buyerValue <= 0) {

            console.log("Validation Failed");

            return res.status(400).json({
                success: false,
                message: "Please confirm the Final Buyer Value before closing the deal."
            });

        }

    }

    const confirmedBy =
        req.session.adminName
            ? `Admin - ${req.session.adminName}`
            : req.session.executiveName;

    console.log("Confirmed By:", confirmedBy);

    const result = await Buyer.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status,
            buyerValue: Number(req.body.buyerValue),
            buyerValueConfirmedBy: confirmedBy,
            buyerValueConfirmedAt: new Date()
        },
        { new: true }
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

    console.log("Update Result:", {
        found: !!result,
        status: result?.status,
        buyerValue: result?.buyerValue,
        buyerValueConfirmedBy: result?.buyerValueConfirmedBy
    });

    appendBuyerTimeline(
        buyer,
        confirmedBy,
        "PreSales",
        "Status Changed",
        previousStatus,
        req.body.status
    );

appendDailyLog(

    req.session.tenantId,

    `${req.session.adminName || req.session.executiveName} changed ${buyer.name} from ${previousStatus} to ${req.body.status}`

);

    console.log("Status Timeline Added");

    appendBuyerTimeline(
        buyer,
        confirmedBy,
        "PreSales",
        "Final Buyer Value Confirmed",
        `₹${buyer.buyerValue}`,
        req.body.status
    );

appendDailyLog(

    req.session.tenantId,

    `${confirmedBy} confirmed buyer value for ${buyer.name} (₹${buyer.buyerValue})`

);

    console.log("Buyer Value Timeline Added");

    const verify = await Buyer.findById(req.params.id);

    console.log("Database After Update:", {
        status: verify.status,
        buyerValue: verify.buyerValue,
        buyerValueConfirmedBy: verify.buyerValueConfirmedBy,
        buyerValueConfirmedAt: verify.buyerValueConfirmedAt
    });

    console.log("========== STATUS UPDATE END ==========");

    res.redirect('/buyer/unqualified');

});
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
    tenantId: req.session.tenantId
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

res.redirect('/buyer/unqualified')

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

console.log("unqualifiedbuyerRoutes.js LOADED");

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
    (req, res) => {

        res.redirect(307, '/buyer/bulk-upload');

    }
);

module.exports = router