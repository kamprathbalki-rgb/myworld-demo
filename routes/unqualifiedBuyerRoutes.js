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
    await Buyer.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status }
    );

    res.redirect('/buyer/unqualified');
});

router.post(
    '/status-unqualified-drag/:id',
    isLoggedIn,
    async (req, res) => {

        try {

            await Buyer.findOneAndUpdate(
                {
                    _id: req.params.id,
                    tenantId: req.session.tenantId
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