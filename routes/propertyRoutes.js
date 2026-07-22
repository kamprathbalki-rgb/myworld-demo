const express = require('express')
const router = express.Router()
const { isLoggedIn,isAdmin } = require('../middleware/auth')

const { sendEmail } =
require('../utils/emailService')

const Tenant =
require('../models/Tenant')

const Property = require('../models/Property')

const Buyer = require('../models/Buyer')
const Recommendation = require('../models/Recommendation')
const calculateScore = require('../services/matchService')
const generateRecommendations = require('../services/recommendationService')
const getSimilarProperties = require('../services/similarPropertyService')
const Shortlist = require('../models/Shortlist')
const builderContactRoles = require('../data/builderContactRoles');
const multer = require('multer')
const path = require('path')
const XLSX = require('xlsx')

const uploadExcel = multer({
    storage: multer.memoryStorage()
})

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, 'public/uploads/properties')
    },

    filename: function (req, file, cb) {

        cb(
            null,
            Date.now() +
            path.extname(file.originalname)
        )

    }

})

const upload = multer({
    storage: storage
})

const Executive = require('../models/Executive');

const {
    notifyExecutive
} = require('../services/notificationService');


const {
    downloadCSV,
    downloadExcel,
    createCSVBuffer,
    createExcelBuffer
} = require("../services/bulkDownloadService");

const archiver = require("archiver");

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
    XLSX.utils.sheet_to_json(sheet, {
        defval: ''
    })

let importedCount = 0
let duplicateCount = 0
let invalidLocationCount = 0
let invalidLocations = []
let missingLocationRequests = []
let duplicateLocations = []

for (const row of rows) {

const existingProperty = await Property.findOne({

    tenantId:
    req.session.tenantId,

    ownerMobile:
    String(
        row['Owner Mobile'] || ''
    ),

    propertyLocation:
    row['Property Location'],

    transactionType:
    (
        row['Transaction Type']
        ||
        'SALE'
    ).toUpperCase()

})

if (existingProperty) {

if (
    !duplicateLocations.includes(
        row['Property Location']
    )
) {
    duplicateLocations.push(
        row['Property Location']
    )
}

    duplicateCount++
    continue
}

const location = await LocationMaster.findOne({
    officeName: {
        $regex: '^' + row['Property Location'],
        $options: 'i'
    }
})

if (!location) {

    invalidLocationCount++

if (
    !missingLocationRequests.includes(
        row['Property Location']
    )
) {
    missingLocationRequests.push(
        row['Property Location']
    )
}

    continue
}

    const property = new Property({

askingPricePerSqFt:

row['Quoted Price Lakhs'] &&
row['Carpet Area SqFt']

? Math.round(

(
    Number(row['Quoted Price Lakhs']) *
    100000
)
/
Number(row['Carpet Area SqFt'])

)

: 0,

        tenantId: req.session.tenantId,

        propertyMode: row['Property Mode'],

        projectName: row['Project Name'],

        builderName: row['Builder Name'],

        ownerName: row['Owner Name'],

        ownerMobile: String(
            row['Owner Mobile'] || ''
        ),

        propertyLocation: location.officeName,

        city: location.city || row['City'],

        projectType: [
            row['Project Type']
        ],

        propertyType: [
            row['Property Type']
        ],

        location: {
    type: "Point",
    coordinates: [
        Number(location.lng),
        Number(location.lat)
    ]
},

divisionName: location.divisionName,
pincode: location.pincode,
district: location.district,
stateName: location.stateName,

        projectStatus: row['Project Status'],

        propertyStatus: row['Property Status'],

transactionType:
(
row['Transaction Type']
||
'SALE'
)
.toUpperCase(),

monthlyRent:
Number(
row['Monthly Rent'] || 0
),

securityDeposit:
Number(
row['Security Deposit'] || 0
),

maintenanceCharges:
Number(
row['Maintenance Charges'] || 0
),

leaseDurationMonths:
Number(
row['Lease Duration'] || 0
),


        reraApproved: row['RERA Approved'],

        singleFlatType: row['Flat Type'],

        singleCarpetArea: Number(
            row['Carpet Area SqFt'] || 0
        ),

        singleQuotedPrice: Number(
            row['Quoted Price Lakhs'] || 0
        ),

        singleClosingPrice: Number(
            row['Closing Price Lakhs'] || 0
        ),

        furnishedStatus:
            row['Furnished Status'],

        parkingType:
            row['Parking Type'],

        possessionStatus:
            row['Possession Status'],

        numberOfTowers:
            Number(
                row['Number Of Towers'] || 0
            ),

        amenities:
            row['Amenities']
            ? row['Amenities'].split(',')
            : [],

        usp: row['USP'],

        notes: row['Notes']

    })

    await property.save()

importedCount++

}

if (missingLocationRequests.length > 0) {

    const tenant = await Tenant.findById(
        req.session.tenantId
    )

    await sendEmail(

        'kbalki2k15@gmail.com',

        'New Locations Requested',

        `
        <h2>Location Master Update Required</h2>

        <p>
        Tenant:
        ${tenant?.name || ''}
        </p>

        <p>
        Missing Locations:
        </p>

        <pre>
${missingLocationRequests.join('\n')}
        </pre>
        `

    ).catch(console.error)

}

if (duplicateLocations.length > 0) {

    const tenant = await Tenant.findById(
        req.session.tenantId
    )

    await sendEmail(

        tenant.adminEmail,

        'Property Upload Duplicates',

        `
        <h2>Duplicate Properties Found</h2>

        <p>
        Tenant:
        ${tenant?.name || ''}
        </p>

        <pre>
${duplicateLocations.join('\n')}
        </pre>
        `

    ).catch(console.error)

}


res.render('bulkUploadResult', {

    importedCount,

    duplicateCount,

    invalidLocationCount,

    duplicateLocations,

    missingLocationRequests

})

    }
)

router.post('/add', async (req,res)=>{

const property = new Property({
...req.body,
tenantId:req.session.tenantId
})

await property.save()

await generateRecommendations(property)

res.json(property)

})

router.get(
    '/bulk-upload',
    isLoggedIn,
    isAdmin,
    (req, res) => {

        res.render('propertyBulkUpload')

    }
)

router.get('/shortlist/:propertyId/:buyerId', async (req,res)=>{

await Shortlist.create({
propertyId:req.params.propertyId,
buyerId:req.params.buyerId,
tenantId:req.session.tenantId
})

res.send("Property Shortlisted")

})

router.get('/similar/:propertyId', async (req,res)=>{

const property = await Property.findById(req.params.propertyId)

const similar = await getSimilarProperties(property)

res.render('similarProperties',{ properties:similar })

})

router.get('/generate-recommendations', async (req,res)=>{

const buyers = await Buyer.find({ tenantId:req.session.tenantId })

const properties = await Property.find({ tenantId:req.session.tenantId })

await Recommendation.deleteMany({ tenantId: req.session.tenantId })

for (const buyer of buyers) {

for (const property of properties) {

const score = await calculateScore(property, buyer)

if (score >= 50) {

await Recommendation.create({
buyerId: buyer._id,
propertyId: property._id,
tenantId: req.session.tenantId,
score: score
})

}

}

}

res.send("Recommendations Generated")

})


router.get(
    '/page',
    isLoggedIn,
    async (req, res) => {

const transactionType =
req.query.transactionType;

const filter = {
tenantId: req.session.tenantId
};

if (
transactionType &&
transactionType !== 'ALL'
) {

filter.transactionType =
transactionType;

}

const properties =
await Property.find(filter)
.sort({
createdAt: -1
});

res.render(
'properties',
{
properties,
transactionType
}
);

})


router.get(
    '/details/:id',
    isLoggedIn,
    async (req, res) => {

    const property = await Property.findOne({
        _id: req.params.id,
        tenantId: req.session.tenantId
    })

    if (!property) {
        return res.send("Project not found")
    }

    if (property.propertyMode === 'SINGLE') {

        return res.render('singlePropertyDetails', {
            property
        })

    }

    res.render('builderPropertyDetails', {
        property
    })

})

router.get(
    '/list',
    isLoggedIn,
    async (req,res)=>{

const properties = await Property.find({ tenantId:req.session.tenantId })

res.json(properties)

})

const LocationMaster = require('../models/LocationMaster')

router.get('/add', isLoggedIn, isAdmin, (req, res) => {

    res.render('propertyTypeSelection')

})


router.get('/add-builder', isLoggedIn, isAdmin, async (req, res) => {

    const locations = await LocationMaster.find({})
        .sort({ officeName: 1 });

    res.render('addBuilderProperty', {
        locations,
        builderContactRoles
    });

});


router.get('/add-single', isLoggedIn, isAdmin, async (req, res) => {

    const locations = await LocationMaster.find({})
    .sort({ officeName: 1 })

res.render('addSingleProperty', {
    locations,
    error: req.query.error || ''
})

})



router.get('/nearby/:lng/:lat/:radius', async (req,res)=>{

const { lng, lat, radius } = req.params

const properties = await Property.find({
tenantId:req.session.tenantId,
location:{

$near: {

$geometry: {
type: "Point",
coordinates: [parseFloat(lng), parseFloat(lat)]
},

$maxDistance: parseInt(radius)

}

}

})

res.json(properties)

})

router.get('/search', async (req,res)=>{

const {
    minPrice,
    maxPrice,
    bedrooms,
    propertyLocation
} = req.query

let filter = {
    tenantId: req.session.tenantId,
    propertyStatus: { $ne: 'Sold' }
}

if(
req.query.transactionType
){

filter.transactionType =
req.query.transactionType

}

if(
req.query.transactionType === 'RENT' ||
req.query.transactionType === 'LEASE'
){

if(minPrice && maxPrice){

filter.monthlyRent = {
    $gte: Number(minPrice),
    $lte: Number(maxPrice)
}

}

}else{

if(minPrice && maxPrice){

filter.singleQuotedPrice = {
    $gte: Number(minPrice),
    $lte: Number(maxPrice)
}

}

}

if(bedrooms){
filter.singleFlatType = bedrooms
}

if(propertyLocation){
filter.propertyLocation = propertyLocation
}

const properties = await Property.find(filter)

res.json(properties)

})


router.get('/sold', async (req, res) => {

    const properties = await Property.find({
        tenantId: req.session.tenantId,
        propertyStatus: 'Sold'
    })

    res.render('properties', {
        properties
    })

})


router.get('/token', async (req, res) => {

    const properties = await Property.find({
        tenantId: req.session.tenantId,
        propertyStatus: 'Token Received'
    })

    res.render('properties', {
        properties
    })

})



router.post(
    '/save',
    isLoggedIn,
    isAdmin,
    upload.single('coverPhoto'),
    async (req, res) => {

if (req.body.propertyMode === 'PROJECT') {

    const duplicateProject = await Property.findOne({
        tenantId: req.session.tenantId,
        projectName: req.body.projectName,
        builderName: req.body.builderName,
        propertyLocation: req.body.propertyLocation
    })

    if (duplicateProject) {

        return res.redirect(
            '/property/add-builder?error=' +
            encodeURIComponent(
                'Project already exists'
            )
        )

    }

}


if (req.body.propertyMode === 'SINGLE') {

    if (!/^\d{10}$/.test(req.body.ownerMobile || '')) {

        return res.redirect(
            '/property/add-single?error=' +
            encodeURIComponent(
                'Owner Mobile must be exactly 10 digits'
            )
        )
    }

const duplicateProperty = await Property.findOne({

    tenantId:
    req.session.tenantId,

    ownerMobile:
    req.body.ownerMobile,

    propertyLocation:
    req.body.propertyLocation,

    transactionType:
    req.body.transactionType

})

    if (duplicateProperty) {

        return res.redirect(
            '/property/add-single?error=' +
            encodeURIComponent(
                'Property already exists for this owner and location'
            )
        )
    }
}

if (!req.body.propertyLocation) {
    return res.redirect(
        '/property/add-single?error=' +
        encodeURIComponent(
            'Property Location is required'
        )
    )
}

if (
    req.body.propertyMode === 'SINGLE' &&
    !req.body.singleFlatType
) {
    return res.redirect(
        '/property/add-single?error=' +
        encodeURIComponent(
            'Flat Type is required'
        )
    )
}

if (
    req.body.propertyMode === 'SINGLE' &&
    !req.body.singleCarpetArea
) {
    return res.redirect(
        '/property/add-single?error=' +
        encodeURIComponent(
            'Carpet Area is required'
        )
    )
}

if (
    req.body.propertyMode === 'SINGLE' &&
    !req.body.askingPrice
) {
    return res.redirect(
        '/property/add-single?error=' +
        encodeURIComponent(
            'Asking Price is required'
        )
    )
}

const LocationMaster = require('../models/LocationMaster')

const configurations = []

function addConfiguration(flatType, carpetArea, quotedPrice, closingPrice, availableUnits) {
    if (carpetArea || quotedPrice || closingPrice || availableUnits) {
        configurations.push({
            flatType,
            propertyMode: req.body.propertyMode,
            carpetArea: carpetArea || 0,
            quotedPrice: quotedPrice || 0,
            closingPrice: closingPrice || 0,
            quotedPricePerSqFt:
    quotedPrice && carpetArea
        ? Math.round(
            (Number(quotedPrice) * 100000) /
            Number(carpetArea)
          )
        : 0,

closingPricePerSqFt:
    closingPrice && carpetArea
        ? Math.round(
            (Number(closingPrice) * 100000) /
            Number(carpetArea)
          )
        : 0,
            furnishedStatus: req.body.furnishedStatus,
            parkingType: req.body.parkingType || [],
            possessionStatus: req.body.possessionStatus || [],
            towerName: req.body.towerName,
            availableUnits: availableUnits || 0
        })
    }
}

/*
Flat configurations
*/

addConfiguration(
    "Studio",
    req.body.carpetArea_studio,
    req.body.quotedPrice_studio,
    req.body.closingPrice_studio,
    req.body.availableUnits_studio
)

addConfiguration(
    "1 RK",
    req.body.carpetArea_1RK,
    req.body.quotedPrice_1RK,
    req.body.closingPrice_1RK,
    req.body.availableUnits_1RK
)

addConfiguration(
    "1 BHK",
    req.body.carpetArea_1BHK,
    req.body.quotedPrice_1BHK,
    req.body.closingPrice_1BHK,
    req.body.availableUnits_1BHK
)

addConfiguration(
    "1.5 BHK",
    req.body.carpetArea_1_5BHK,
    req.body.quotedPrice_1_5BHK,
    req.body.closingPrice_1_5BHK,
    req.body.availableUnits_1_5BHK
)

addConfiguration(
    "2 BHK",
    req.body.carpetArea_2BHK,
    req.body.quotedPrice_2BHK,
    req.body.closingPrice_2BHK,
    req.body.availableUnits_2BHK
)

addConfiguration(
    "2.5 BHK",
    req.body.carpetArea_2_5BHK,
    req.body.quotedPrice_2_5BHK,
    req.body.closingPrice_2_5BHK,
    req.body.availableUnits_2_5BHK
)

addConfiguration(
    "3 BHK",
    req.body.carpetArea_3BHK,
    req.body.quotedPrice_3BHK,
    req.body.closingPrice_3BHK,
    req.body.availableUnits_3BHK
)

addConfiguration(
    "3.5 BHK",
    req.body.carpetArea_3_5BHK,
    req.body.quotedPrice_3_5BHK,
    req.body.closingPrice_3_5BHK,
    req.body.availableUnits_3_5BHK
)

addConfiguration(
    "4 BHK",
    req.body.carpetArea_4BHK,
    req.body.quotedPrice_4BHK,
    req.body.closingPrice_4BHK,
    req.body.availableUnits_4BHK
)

addConfiguration(
    "4.5 BHK",
    req.body.carpetArea_4_5BHK,
    req.body.quotedPrice_4_5BHK,
    req.body.closingPrice_4_5BHK,
    req.body.availableUnits_4_5BHK
)

addConfiguration(
    "5 BHK",
    req.body.carpetArea_5BHK,
    req.body.quotedPrice_5BHK,
    req.body.closingPrice_5BHK,
    req.body.availableUnits_5BHK
)

addConfiguration(
    "5+ BHK",
    req.body.carpetArea_5PlusBHK,
    req.body.quotedPrice_5PlusBHK,
    req.body.closingPrice_5PlusBHK,
    req.body.availableUnits_5PlusBHK
)

addConfiguration(
    "Villa",
    req.body.carpetArea_villa,
    req.body.quotedPrice_villa,
    req.body.closingPrice_villa,
    req.body.availableUnits_villa
)

addConfiguration(
    "Plot",
    req.body.carpetArea_plot,
    req.body.quotedPrice_plot,
    req.body.closingPrice_plot,
    req.body.availableUnits_plot
)

addConfiguration(
    "Office",
    req.body.carpetArea_office,
    req.body.quotedPrice_office,
    req.body.closingPrice_office,
    req.body.availableUnits_office
)

addConfiguration(
    "Showroom",
    req.body.carpetArea_showroom,
    req.body.quotedPrice_showroom,
    req.body.closingPrice_showroom,
    req.body.availableUnits_showroom
)

addConfiguration(
    "Retail",
    req.body.carpetArea_retail,
    req.body.quotedPrice_retail,
    req.body.closingPrice_retail,
    req.body.availableUnits_retail
)

addConfiguration(
    "Shop",
    req.body.carpetArea_shop,
    req.body.quotedPrice_shop,
    req.body.closingPrice_shop,
    req.body.availableUnits_shop
)



/*
Auto-fetch location details
from Location Master
based on selected propertyLocation (officeName)
*/

const selectedLocation = await LocationMaster.findOne({
officeName: req.body.propertyLocation
})

const lng = Number(req.body.lng)
const lat = Number(req.body.lat)

const location =
Number.isFinite(lng) && Number.isFinite(lat)
? {
    type: "Point",
    coordinates: [lng, lat]
  }
: undefined

let propertyType = req.body.propertyType || []

if (!Array.isArray(propertyType)) {
    propertyType = [propertyType]
}

const askingPricePerSqFt =
    req.body.askingPrice &&
    req.body.singleCarpetArea
        ? (
            (Number(req.body.askingPrice) * 100000) /
            Number(req.body.singleCarpetArea)
          ).toFixed(0)
        : 0

let projectType = req.body.projectType || []

if (!Array.isArray(projectType)) {
    projectType = [projectType]
}

let propertyStatus = req.body.propertyStatus

if (Array.isArray(propertyStatus)) {
    propertyStatus = propertyStatus[0]
}

    const property = new Property({

    tenantId: req.session.tenantId,

    propertyMode: req.body.propertyMode,

transactionType:
req.body.transactionType,

monthlyRent:
Number(req.body.monthlyRent || 0),

securityDeposit:
Number(req.body.securityDeposit || 0),

maintenanceCharges:
Number(req.body.maintenanceCharges || 0),

leaseDurationMonths:
Number(req.body.leaseDurationMonths || 0),

    ownerName: req.body.ownerName,
    ownerMobile: req.body.ownerMobile,

propertyStatus: propertyStatus || 'Available',

floorNumber: req.body.floorNumber,

totalFloors: req.body.totalFloors,

facing: req.body.facing,

liftAvailable: req.body.liftAvailable,

propertyAge: req.body.propertyAge,

    singleFlatType: req.body.singleFlatType,
    singleCarpetArea: req.body.singleCarpetArea,

    singleQuotedPrice: req.body.askingPrice,
    singleClosingPrice: req.body.expectedClosingPrice,

    parkingType: req.body.parkingType,
    furnishedStatus: req.body.furnishedStatus,
    possessionStatus: req.body.possessionStatus,

    askingPricePerSqFt: askingPricePerSqFt,

    // Basic Project Information

    projectName: req.body.projectName,
    builderName: req.body.builderName,

    projectType: projectType,

    propertyType: propertyType,

    projectStatus: req.body.projectStatus,
    reraApproved: req.body.reraApproved,

    coverPhoto: req.file
    ? req.file.filename
    : '',

    city: req.body.city,
    direction: req.body.direction,

    askingPricePerSqFt: askingPricePerSqFt,

    /*
    User selects only this
    */

    propertyLocation: req.body.propertyLocation,

    /*
    Auto-filled from locationmasters
    */

    divisionName: selectedLocation ? selectedLocation.divisionName : "",
    pincode: selectedLocation ? selectedLocation.pincode : "",
    district: selectedLocation ? selectedLocation.district : "",
    stateName: selectedLocation ? selectedLocation.stateName : "",

    locationLandmark: req.body.locationLandmark,
    googlePin: req.body.googlePin,

    // Geo location

...(location ? { location } : {}),

    // Tower Summary

    numberOfTowers: req.body.numberOfTowers,

    // Towers

    towers: [
        {
            towerName: req.body.towerName,
            numberOfFloors: req.body.numberOfFloors,
            towerStatus: req.body.towerStatus,
            inventoryStatus: req.body.inventoryStatus,
            possessionMonth: req.body.possessionMonth,
            possessionYear: req.body.possessionYear
        }
    ],

    // Configurations

    configurations: configurations,

    // Highlights

    amenities: req.body.amenities
        ? req.body.amenities.split(',')
        : [],

    usp: req.body.usp,

    notes: req.body.notes,

builderContacts: (req.body.contactName || []).map((name, index) => ({
    role: req.body.contactRole[index],
    designation: req.body.contactDesignation[index],
    name: name,
    mobile: req.body.contactMobile[index],
    alternateMobile: req.body.contactAlternateMobile[index],
    email: req.body.contactEmail[index],
    isPrimary: String(req.body.primaryContact) === String(index)
}))

})

await property.save()

const executives = await Executive.find({

    tenantId: req.session.tenantId,

    assignedLocations: property.propertyLocation,

    isActive: true

});

for (const executive of executives) {

    await notifyExecutive(

        executive,

        `New Property Added

Project: ${property.projectName || 'Property'}

Location: ${property.propertyLocation}`

    );

}


res.redirect('/property/page')

})


router.delete(
    '/delete/:id',
    isLoggedIn,
    isAdmin,
    async (req,res)=>{

await Property.findOneAndDelete({
_id:req.params.id,
tenantId:req.session.tenantId
})

res.json({ message:"Property deleted" })

})


router.get(
    '/edit/:id',
    isLoggedIn,
    isAdmin,
    async (req, res) => {

    const property = await Property.findOne({
        _id: req.params.id,
        tenantId: req.session.tenantId
    })

    const locations = await LocationMaster.find({})
        .sort({ officeName: 1 })

    if (!property) {
        return res.send("Property not found")
    }

    if (property.propertyMode === 'SINGLE') {

        return res.render('editSingleProperty', {
            property,
            locations
        })

    }

    res.render('editBuilderProperty', {
        property,
        locations
    })

})

router.post(
    '/update/:id',
    isLoggedIn,
    isAdmin,
    upload.single('coverPhoto'),
    async (req, res) => {

const configurations = []

function addConfiguration(flatType, carpetArea, quotedPrice, closingPrice, availableUnits) {
    if (carpetArea || quotedPrice || closingPrice || availableUnits) {
        configurations.push({
            flatType,
            carpetArea: carpetArea || 0,
            quotedPrice: quotedPrice || 0,
            closingPrice: closingPrice || 0,
            furnishedStatus: req.body.furnishedStatus,
            parkingType: req.body.parkingType || [],
            possessionStatus: req.body.possessionStatus || [],
            towerName: req.body.towerName,
            availableUnits: availableUnits || 0
        })
    }
}

/*
All configurations
*/

addConfiguration("Studio", req.body.carpetArea_studio, req.body.quotedPrice_studio, req.body.closingPrice_studio, req.body.availableUnits_studio)
addConfiguration("1 RK", req.body.carpetArea_1RK, req.body.quotedPrice_1RK, req.body.closingPrice_1RK, req.body.availableUnits_1RK)
addConfiguration("1 BHK", req.body.carpetArea_1BHK, req.body.quotedPrice_1BHK, req.body.closingPrice_1BHK, req.body.availableUnits_1BHK)
addConfiguration("1.5 BHK", req.body.carpetArea_1_5BHK, req.body.quotedPrice_1_5BHK, req.body.closingPrice_1_5BHK, req.body.availableUnits_1_5BHK)
addConfiguration("2 BHK", req.body.carpetArea_2BHK, req.body.quotedPrice_2BHK, req.body.closingPrice_2BHK, req.body.availableUnits_2BHK)
addConfiguration("2.5 BHK", req.body.carpetArea_2_5BHK, req.body.quotedPrice_2_5BHK, req.body.closingPrice_2_5BHK, req.body.availableUnits_2_5BHK)
addConfiguration("3 BHK", req.body.carpetArea_3BHK, req.body.quotedPrice_3BHK, req.body.closingPrice_3BHK, req.body.availableUnits_3BHK)
addConfiguration("3.5 BHK", req.body.carpetArea_3_5BHK, req.body.quotedPrice_3_5BHK, req.body.closingPrice_3_5BHK, req.body.availableUnits_3_5BHK)
addConfiguration("4 BHK", req.body.carpetArea_4BHK, req.body.quotedPrice_4BHK, req.body.closingPrice_4BHK, req.body.availableUnits_4BHK)
addConfiguration("4.5 BHK", req.body.carpetArea_4_5BHK, req.body.quotedPrice_4_5BHK, req.body.closingPrice_4_5BHK, req.body.availableUnits_4_5BHK)
addConfiguration("5 BHK", req.body.carpetArea_5BHK, req.body.quotedPrice_5BHK, req.body.closingPrice_5BHK, req.body.availableUnits_5BHK)
addConfiguration("5+ BHK", req.body.carpetArea_5PlusBHK, req.body.quotedPrice_5PlusBHK, req.body.closingPrice_5PlusBHK, req.body.availableUnits_5PlusBHK)

addConfiguration("Villa", req.body.carpetArea_villa, req.body.quotedPrice_villa, req.body.closingPrice_villa, req.body.availableUnits_villa)
addConfiguration("Plot", req.body.carpetArea_plot, req.body.quotedPrice_plot, req.body.closingPrice_plot, req.body.availableUnits_plot)
addConfiguration("Office", req.body.carpetArea_office, req.body.quotedPrice_office, req.body.closingPrice_office, req.body.availableUnits_office)
addConfiguration("Showroom", req.body.carpetArea_showroom, req.body.quotedPrice_showroom, req.body.closingPrice_showroom, req.body.availableUnits_showroom)
addConfiguration("Retail", req.body.carpetArea_retail, req.body.quotedPrice_retail, req.body.closingPrice_retail, req.body.availableUnits_retail)
addConfiguration("Shop", req.body.carpetArea_shop, req.body.quotedPrice_shop, req.body.closingPrice_shop, req.body.availableUnits_shop)

const selectedLocation = await LocationMaster.findOne({
    officeName: req.body.propertyLocation
})

const lng =
    Number(req.body.lng) ||
    Number(selectedLocation?.lng)

const lat =
    Number(req.body.lat) ||
    Number(selectedLocation?.lat)

const location =
(
    Number.isFinite(lng) &&
    Number.isFinite(lat)
)
? {
    type: "Point",
    coordinates: [lng, lat]
}
: undefined

const existingProperty = await Property.findOne({
    _id: req.params.id,
    tenantId: req.session.tenantId
})

let soldDate = existingProperty.soldDate

if (
    req.body.propertyStatus === 'Sold' &&
    !existingProperty.soldDate
) {
    soldDate = new Date()
}

let projectType = req.body.projectType || []

if (!Array.isArray(projectType)) {
    projectType = [projectType]
}

let propertyType = req.body.propertyType || []

if (!Array.isArray(propertyType)) {
    propertyType = [propertyType]
}

await Property.findOneAndUpdate(

{
    _id: req.params.id,
    tenantId: req.session.tenantId
},
{

    propertyMode: req.body.propertyMode,

transactionType:
req.body.transactionType,

    projectName: req.body.projectName,
    builderName: req.body.builderName,

    ownerName: req.body.ownerName,
    ownerMobile: req.body.ownerMobile,

singleFlatType: req.body.singleFlatType,
singleCarpetArea: req.body.singleCarpetArea,
singleQuotedPrice: req.body.singleQuotedPrice,
singleClosingPrice: req.body.singleClosingPrice,

monthlyRent:
Number(req.body.monthlyRent || 0),

securityDeposit:
Number(req.body.securityDeposit || 0),

maintenanceCharges:
Number(req.body.maintenanceCharges || 0),

leaseDurationMonths:
Number(req.body.leaseDurationMonths || 0),


parkingType: req.body.parkingType,
furnishedStatus: req.body.furnishedStatus,
possessionStatus: req.body.possessionStatus,

    projectType: projectType,
    propertyType: propertyType,

    projectStatus: req.body.projectStatus,

    soldDate: soldDate,
    reraApproved: req.body.reraApproved,

coverPhoto: req.file
    ? req.file.filename
    : existingProperty.coverPhoto,

    city: req.body.city,
    direction: req.body.direction,

    propertyLocation: req.body.propertyLocation,

    divisionName: selectedLocation ? selectedLocation.divisionName : "",
    pincode: selectedLocation ? selectedLocation.pincode : "",
    district: selectedLocation ? selectedLocation.district : "",
    stateName: selectedLocation ? selectedLocation.stateName : "",

    locationLandmark: req.body.locationLandmark,
    googlePin: req.body.googlePin,

...(location ? { location } : {}),

    numberOfTowers: req.body.numberOfTowers,

    towers: [
        {
            towerName: req.body.towerName,
            numberOfFloors: req.body.numberOfFloors,
            towerStatus: req.body.towerStatus,
            inventoryStatus: req.body.inventoryStatus,
            possessionMonth: req.body.possessionMonth,
            possessionYear: req.body.possessionYear
        }
    ],

    configurations: configurations,

    amenities: req.body.amenities
        ? req.body.amenities.split(',')
        : [],

    usp: req.body.usp,

    notes: req.body.notes,

builderContacts: (req.body.contactName || []).map((name, index) => ({
    role: req.body.contactRole[index],
    designation: req.body.contactDesignation[index],
    name: name,
    mobile: req.body.contactMobile[index],
    alternateMobile: req.body.contactAlternateMobile[index],
    email: req.body.contactEmail[index],
    isPrimary: String(req.body.primaryContact) === String(index)
}))

}
)

res.redirect('/property/page')

})


router.get(
    '/delete/:id',
    isLoggedIn,
    isAdmin,
    async (req, res) => {

const property = await Property.findOne({
    _id: req.params.id,
    tenantId: req.session.tenantId
})

if (property && property.propertyStatus === 'Sold') {
    return res.send(
        'Sold properties cannot be deleted'
    )
}


await Property.findOneAndDelete({
    _id: req.params.id,
    tenantId: req.session.tenantId
})

res.redirect('/property/page')

})

router.get('/map', async (req,res)=>{

const properties = await Property.find(
{
    tenantId:req.session.tenantId,
    location:{ $exists:true }
},
{
    projectName:1,
    propertyLocation:1,
    propertyStatus:1,
    location:1
})

res.json(properties)

})

router.get('/map-radius/:lng/:lat/:radius', async (req,res)=>{

const { lng, lat, radius } = req.params

const properties = await Property.find({
tenantId:req.session.tenantId,
location:{

$near:{
$geometry:{
type:"Point",
coordinates:[parseFloat(lng),parseFloat(lat)]
},
$maxDistance:parseInt(radius)
}
}

},
{
projectName:1,
propertyLocation:1,
singleQuotedPrice:1,
singleFlatType:1,
location:1
})

res.json(properties)

})

router.get('/map-view',(req,res)=>{

res.render('map')

})

router.get('/buyer-map/:buyerId',(req,res)=>{
res.render('buyerMap',{ buyerId:req.params.buyerId })
})

router.get(
    "/export/csv",
    isLoggedIn,
    isAdmin,
    async (req, res) => {

        const properties =
        await Property.find({
            tenantId: req.session.tenantId
        })
        .lean();

        downloadCSV(
            res,
            properties,
            `properties-${new Date().toISOString().slice(0,10)}`
        );

    }
);

router.get(
    "/export/excel",
    isLoggedIn,
    isAdmin,
    async (req, res) => {

        const properties =
        await Property.find({
            tenantId: req.session.tenantId
        })
        .lean();

        downloadExcel(
            res,
            properties,
            `properties-${new Date().toISOString().slice(0,10)}`
        );

    }
);

module.exports = router