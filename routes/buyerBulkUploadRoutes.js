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
const {mapBuyerExecutives} = require("../services/executiveMappingService");
const {notifyExecutive} = require('../services/notificationService');


const XLSX = require('xlsx');

const multer = require('multer');

const uploadExcel = multer({
    storage: multer.memoryStorage()
});

const Tenant = require('../models/Tenant');

const { sendEmail } =
require('../utils/emailService');

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

const TESTING = true;

router.get(
    '/bulk-upload-unqualified',
    isLoggedIn,
    isAdmin,
    (req, res) => {

        if (TESTING) {
            return res.render('LeadBulkUpload');
        }

        res.render('unqualifiedLeadBulkUpload');

    }
);


router.post(
    '/bulk-upload',
    isLoggedIn,
    isAdmin,
    uploadExcel.single('excelFile'),
    async (req, res) => {

        const workbook = XLSX.read(
            req.file.buffer,
            { type: 'buffer' }
        );

        const sheet =
            workbook.Sheets[
                workbook.SheetNames[0]
            ];

        const rows =
            XLSX.utils.sheet_to_json(
                sheet,
                { defval: '' }
            );

  await importQualifiedRows(
    rows,
    req,
    res
);

});

async function importQualifiedRows(
    rows,
    req,
    res
) {

      let importedCount = 0;
        let duplicateCount = 0;
        let invalidCount = 0;

        let duplicateMobiles = [];
        let invalidRows = [];
        let missingLocationRequests = [];

        // =====================================
        // PROCESS EACH ROW
        // =====================================

 for (const [index, row] of rows.entries()) {

    const rowNumber = index + 2;   // Excel row number

    const rowErrors = [];

// =====================================
// BUYER NAME
// =====================================

if (
    !row.Name ||
    !String(row.Name).trim()
) {

    rowErrors.push(
        "Buyer Name is mandatory"
    );

}

// =====================================
// MOBILE
// =====================================

if (
    !row.Phone ||
    !/^\d{10}$/.test(
        String(row.Phone)
    )
) {

    rowErrors.push(
        `Invalid Mobile (${row.Phone || 'Blank'})`
    );

}

// =====================================
// DUPLICATE MOBILE
// =====================================

let existingBuyer = null;

if (
    row.Phone &&
    /^\d{10}$/.test(
        String(row.Phone)
    )
) {

    existingBuyer =
        await Buyer.findOne({

            tenantId:
            req.session.tenantId,

            phone:
            String(row.Phone)

        });

    if (existingBuyer) {

        duplicateCount++;

        duplicateMobiles.push(
            `${row.Name} (${row.Phone})`
        );

        rowErrors.push(
            `Duplicate Mobile (${row.Phone})`
        );

    }

}

// =====================================
// PREFERRED LOCATION
// =====================================

let preferredLocations = [

    row['Preferred Location 1'],

    row['Preferred Location 2'],

    row['Preferred Location 3']

].filter(Boolean);

if (
    preferredLocations.length === 0
) {

    rowErrors.push(
        "Preferred Location 1 is mandatory"
    );

}

let locationData = [];

let primaryLocationRecord = null;

if (
    preferredLocations.length > 0
) {

    const primaryLocationName =
        preferredLocations[0];

    primaryLocationRecord =
        await LocationMaster.findOne({

            officeName: {

                $regex:
                '^' + primaryLocationName,

                $options: 'i'

            }

        });

    if (!primaryLocationRecord) {

        rowErrors.push(
            `Primary Location '${primaryLocationName}' not found in Location Master`
        );

        if (
            !missingLocationRequests.includes(
                primaryLocationName
            )
        ) {

            missingLocationRequests.push(
                primaryLocationName
            );

        }

    }
}

// =====================================
// LOCATION DETAILS
// =====================================

let preferredPincodes = [];
let preferredDistricts = [];
let preferredDivisionNames = [];
let stateName = "";
let primaryLocation = "";
let buyerLat = 0;
let buyerLng = 0;
let matchedExecutive = null;

console.log({
    buyingInterest: row["Buying Interest"],
    purchaseTimeline: row["Purchase Timeline"],
    transactionType: row["TransactionType"],
    propertyType: row["Property Type"],
    minBudget: row["Min Budget"],
    configuration: row["Required Flat Type"]
});

const buyingInterest =
String(
    row['Buying Interest'] || ''
)
.trim();


const purchaseTimeline =
String(
    row['Purchase Timeline'] || ''
)
.trim();

let executiveMapping = {
    preSalesExecutiveId: null,
    preSalesExecutiveName: "",
    salesExecutiveId: null,
    salesExecutiveName: ""
};



if (primaryLocationRecord) {

    // Add primary location first
    locationData.push(primaryLocationRecord);

    // Add secondary locations
    for (const locationName of preferredLocations.slice(1)) {

        const location =
            await LocationMaster.findOne({

                officeName: {
                    $regex: '^' + locationName,
                    $options: 'i'
                }

            });

        if (location) {

            locationData.push(location);

        }

    }

    preferredPincodes = [
        ...new Set(locationData.map(l => l.pincode))
    ];

    preferredDistricts = [
        ...new Set(locationData.map(l => l.district))
    ];

    preferredDivisionNames = [
        ...new Set(locationData.map(l => l.divisionName))
    ];

    stateName =
        locationData[0]?.stateName || "";

    primaryLocation =
        primaryLocationRecord.officeName;


    buyerLat =
        Number(locationData[0]?.lat) || 0;

    buyerLng =
        Number(locationData[0]?.lng) || 0;

executiveMapping =
    await mapBuyerExecutives(
        req.session.tenantId,
        primaryLocation
    );

}


// =====================================
// REQUIRED POSSESSION
// =====================================

let requiredPossession =
    row['Required Possession'] || [];

if (
    requiredPossession &&
    typeof requiredPossession === 'string'
) {

    requiredPossession =
        requiredPossession
            .split(',')
            .map(x => x.trim())
            .filter(Boolean);

}


// =====================================
// TRANSACTION TYPE
// =====================================

const transactionType =
String(
    row.TransactionType || 'SALE'
)
.trim()
.toUpperCase();

if (
    ![
        'SALE',
        'RENT',
        'LEASE'
    ].includes(transactionType)
) {

    rowErrors.push(
        `Invalid Transaction Type (${row.TransactionType})`
    );

}

// =====================================
// PROPERTY TYPE
// =====================================

const propertyType =
String(
    row['Property Type'] || ''
)
.trim();

if (
    ![
        'Apartment',
        'Villa',
        'Plot',
        'Office',
        'Showroom',
        'Retail',
        'Shop'
    ].includes(propertyType)
) {

    rowErrors.push(
        `Invalid Property Type (${propertyType || 'Blank'})`
    );

}

// =====================================
// REQUIRED FLAT TYPE
// =====================================

const requiredFlatType =
String(
    row['Required Flat Type'] || ''
)
.trim();

if (
    ![
        'Studio',
        '1 RK',
        '1 BHK',
        '1.5 BHK',
        '2 BHK',
        '2.5 BHK',
        '3 BHK',
        '3.5 BHK',
        '4 BHK',
        '4.5 BHK',
        '5 BHK',
        '5+ BHK',
        'Villa',
        'Plot',
        'Office',
        'Showroom',
        'Retail',
        'Shop'
    ].includes(requiredFlatType)
) {

    rowErrors.push(
        `Invalid Required Flat Type (${requiredFlatType || 'Blank'})`
    );

}


// =====================================
// BUYING INTEREST
// =====================================



if (
    buyingInterest !== 'Yes'
) {

    rowErrors.push(
        `Buying Interest must be Yes (Found: ${buyingInterest || 'Blank'})`
    );

}


// =====================================
// PURCHASE TIMELINE
// =====================================


if (
    ![
        'Immediate',
        '1 Month',
        '3 Months',
        '6 Months',
        '6+ Months'
    ].includes(purchaseTimeline)
) {

    rowErrors.push(
        `Invalid Purchase Timeline (${purchaseTimeline || 'Blank'})`
    );

}


// =====================================
// BUDGET VALIDATION
// =====================================

const minBudget =
    parseFloat(
        String(
            row['Min Budget'] || ''
        )
        .replace(/,/g, '')
        .trim()
    );

const maxBudget =
    parseFloat(
        String(
            row['Max Budget'] || ''
        )
        .replace(/,/g, '')
        .trim()
    );

// At least one budget is mandatory

if (
    isNaN(minBudget) &&
    isNaN(maxBudget)
) {

    rowErrors.push(
        "Minimum Budget or Maximum Budget is mandatory"
    );

}

// Both entered

if (
    !isNaN(minBudget) &&
    !isNaN(maxBudget)
) {

    if (minBudget > maxBudget) {

        rowErrors.push(

            `Minimum Budget (${minBudget}) cannot exceed Maximum Budget (${maxBudget})`

        );

    }

}

// =====================================
// AREA VALIDATION
// =====================================

const minArea =
    parseFloat(
        String(
            row['Min Area'] || ''
        )
        .trim()
    );

const maxArea =
    parseFloat(
        String(
            row['Max Area'] || ''
        )
        .trim()
    );

// One of them is mandatory

if (
    isNaN(minArea) &&
    isNaN(maxArea)
) {

    rowErrors.push(

        "Minimum Area or Maximum Area is mandatory"

    );

}

// Both entered

if (
    !isNaN(minArea) &&
    !isNaN(maxArea)
) {

    if (minArea > maxArea) {

        rowErrors.push(

            `Minimum Area (${minArea}) cannot exceed Maximum Area (${maxArea})`

        );

    }

}


// =====================================
// FINAL VALIDATION
// =====================================

if (rowErrors.length > 0) {

    invalidCount++;

    invalidRows.push({

        row: rowNumber,

        buyer: row.Name || "Unknown",

        mobile: row.Phone || "",

        errors: rowErrors

    });

    continue;

}

// =====================================
// DETERMINE BUYER STATUS
// =====================================

let status =
(
    purchaseTimeline === "Immediate" ||
    purchaseTimeline === "1 Month"
)
? "Qualified"
: "Future Buyer";


// =====================================
//              DEPARTMENT 
// =====================================

let department = "PreSales";

if (
    buyingInterest === "Yes" &&
    (
        purchaseTimeline === "Immediate" ||
        purchaseTimeline === "1 Month"
    )
) {

    department = "Sales";

}

            // =====================================
            // BUYER CREATE
            // =====================================

            const buyer = await Buyer.create({

                tenantId:
                    req.session.tenantId,

                // -----------------------------
                // Basic Details
                // -----------------------------

                name:
                    row.Name.trim(),

                phone:
                    String(row.Phone).trim(),

                email:
                    row.Email || "",

                // -----------------------------
                // Buyer Qualification
                // -----------------------------

                buyingInterest:
                    buyingInterest,

                purchaseTimeline:
                    purchaseTimeline,

                status: status,

                department: department,

                // -----------------------------
                // Budget
                // -----------------------------

                minBudget:
                    minBudget,

                maxBudget:
                    maxBudget,

                // -----------------------------
                // Transaction
                // -----------------------------

                transactionType:
                    transactionType,

                // -----------------------------
                // Property Requirement
                // -----------------------------

                propertyType:
                    propertyType,

                requiredFlatType:
                    requiredFlatType,

                requiredPossession:
                    requiredPossession,

                // -----------------------------
                // Area
                // -----------------------------

                minArea:
                    minArea,

                maxArea:
                    maxArea,

                radius:
                    Number(row['Radius'] || 0),

                // -----------------------------
                // Assignment
                // -----------------------------

                assignmentType:
                    "AUTO",

status: "Qualified",

leadSource: "Excel",

currentOwnerRole: "Executive",

preSalesExecutiveId:
    executiveMapping.preSalesExecutiveId,

preSalesExecutiveName:
    executiveMapping.preSalesExecutiveName,

salesExecutiveId:
    executiveMapping.salesExecutiveId,

salesExecutiveName:
    executiveMapping.salesExecutiveName,

qualificationDate: new Date(),

qualifiedBy:
    req.session.user?.name || "Bulk Upload",

                // -----------------------------
                // Location
                // -----------------------------

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

                preferredLocation: {

                    type: "Point",

                    coordinates: [
                        buyerLng,
                        buyerLat
                    ]

                }

            });

            // =====================================
            // TIMELINE
            // =====================================

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

        // =====================================
        // EMAIL - DUPLICATE MOBILES
        // =====================================

        if (duplicateMobiles.length > 0) {

            const tenant =
                await Tenant.findById(
                    req.session.tenantId
                );

            await sendEmail(

                tenant.adminEmail,

                'Buyer Upload Summary',

                `
                <h2>Buyer Upload Summary</h2>

                <p>
                Tenant:
                ${tenant?.name || ''}
                </p>

                <p>
                Duplicate Buyers:
                </p>

                <pre>
${duplicateMobiles.join('\n')}
                </pre>
                `

            ).catch(console.error);

        }

        // =====================================
        // EMAIL - UNKNOWN LOCATIONS
        // =====================================

        if (
            missingLocationRequests.length > 0
        ) {

            const tenant =
                await Tenant.findById(
                    req.session.tenantId
                );

            await sendEmail(

                process.env.ADMIN_EMAIL,

                'Buyer Upload - New Locations Requested',

                `
                <h2>
                Location Master Update Required
                </h2>

                <p>
                Tenant:
                ${tenant?.name || ''}
                </p>

                <p>
                The following locations were not
                found in the Location Master:
                </p>

                <pre>
${missingLocationRequests.join('\n')}
                </pre>
                `

            ).catch(console.error);

        }

        // =====================================
        // RESULT PAGE
        // =====================================

        res.render(

            'buyerBulkUploadResult',

            {

                importedCount,

                duplicateCount,

                invalidCount,

                duplicateMobiles,

                invalidRows

            }

        );

}

async function importUnqualifiedRows(rows, req, res) {

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

invalidRows.push({
    row: importedCount + duplicateCount + invalidCount + 2,
    buyer: row.Name || "Unknown",
    mobile: row.Phone || "",
    errors: ["Invalid Mobile Number"]
});

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

invalidRows.push({
    row: importedCount + duplicateCount + invalidCount + 2,
    buyer: row.Name || "Unknown",
    mobile: row.Phone || "",
    errors: [
        `Primary Location '${primaryLocationName}' not found`
    ]
});

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

const executiveMapping =
    await mapBuyerExecutives(
        req.session.tenantId,
        primaryLocation
    );

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

invalidRows.push({
    row: importedCount + duplicateCount + invalidCount + 2,
    buyer: row.Name || "Unknown",
    mobile: row.Phone || "",
    errors: [
        `Invalid Transaction Type (${transactionType})`
    ]
});

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

preSalesExecutiveId:
    executiveMapping.preSalesExecutiveId,

preSalesExecutiveName:
    executiveMapping.preSalesExecutiveName,

salesExecutiveId:
    executiveMapping.salesExecutiveId,

salesExecutiveName:
    executiveMapping.salesExecutiveName,

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

await importUnqualifiedRows(rows, req, res);

    }
)

function parseBudget(value) {

    if (!value) return 0;

    let text = String(value)
        .toLowerCase()
        .replace(/,/g, '')
        .replace(/₹|rs\.?/g, '')
        .replace(/lakhs?/g, '')
        .replace(/lakh/g, '')
        .trim();

    // 1.25 Cr
    if (
        text.includes('cr') ||
        text.includes('crore')
    ) {

        const match =
            text.match(/\d+(\.\d+)?/);

        return match
            ? parseFloat(match[0]) * 100
            : 0;
    }

    // 80-90 / 80 to 90 / 80/90
    const match =
        text.match(/\d+(\.\d+)?/);

    if (!match) return 0;

    let number =
        parseFloat(match[0]);

    // Rupee value
    if (number >= 100000) {

        return Math.round(
            number / 100000
        );

    }

    // Already Lakhs
    return Math.round(number);

}


router.post(
    '/bulk-upload-unqualified-map',
    isLoggedIn,
    isAdmin,
    uploadExcel.single('excelFile'),
    async (req, res) => {

        try {

const workbook = XLSX.read(
    req.file.buffer,
    { type: 'buffer' }
);

const sheet =
    workbook.Sheets[
        workbook.SheetNames[0]
    ];

            // Read as array (NOT objects)
            const excelRows = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                defval: ''
            });

            // Skip header row
            const rows = excelRows.slice(1);

            function columnToIndex(col) {

                if (!col) return -1;

                col = col.toUpperCase().trim();

                let index = 0;

                for (let i = 0; i < col.length; i++) {
                    index = index * 26 + (col.charCodeAt(i) - 64);
                }

                return index - 1;
            }

            const nameCol = columnToIndex(req.body.map_name);
            const phoneCol = columnToIndex(req.body.map_phone);
            const emailCol = columnToIndex(req.body.map_email);
            const locationCol = columnToIndex(req.body.map_primaryLocation);

const budgetCol =
    columnToIndex(
        req.body.map_budget
    );

const areaCol =
    columnToIndex(
        req.body.map_area
    );

const mappedRows = rows.map(r => {

    const budget =
        parseBudget(
            r[budgetCol]
        );

const area =
    parseArea(
        r[areaCol]
    );

const configurationCol =
    columnToIndex(
        req.body.map_configuration
    );


    return {

        Name: r[nameCol] || "",

        Phone: r[phoneCol] || "",

        Email: r[emailCol] || "",

        "Required Flat Type":
    r[configurationCol] || "",

        "Preferred Location 1":
            r[locationCol] || "",

        "Min Budget":
            budget,

        "Max Budget":
            Math.round(
                budget * 1.15
            ),

"Min Area": area,

"Max Area": Math.round(
    area * 1.15
),

"Buying Interest": "Yes",

"Purchase Timeline": "1 Month",

"TransactionType": "SALE",

"Property Type": "Apartment",

"Required Possession": [
    "READY"
],

"Radius": 2000

    };

});

function parseArea(value) {

    if (!value) return 0;

    let text = String(value)
        .toLowerCase()
        .replace(/,/g, '')
        .replace(/sq\.?\s*ft|sqft|square\s*feet|sq\s*ft|sft/gi, '')
        .replace(/carpet/gi, '')
        .replace(/built.?up/gi, '')
        .replace(/super.?built.?up/gi, '')
        .trim();

    const match =
        text.match(/\d+(\.\d+)?/);

    if (!match) return 0;

    return Math.round(
        parseFloat(match[0])
    );

}

const isQualified =
    mappedRows.every(row =>

        row["Required Flat Type"] &&
        row["Min Area"] > 0 &&
        row["Min Budget"] > 0

    );

if (isQualified) {

    await importQualifiedRows(
        mappedRows,
        req,
        res
    );

} else {

    await importUnqualifiedRows(
        mappedRows,
        req,
        res
    );

}

return;

        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false,
                message: err.message
            });

        }

    }
);

module.exports = router
