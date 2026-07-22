const mongoose = require('mongoose')

const propertySchema = new mongoose.Schema({

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant'
    },

    projectName: String,

    builderName: String,

    ownerName: String,

    ownerMobile: String,

transactionType:{
type:String,
enum:[
'SALE',
'RENT',
'LEASE'
],
default:'SALE'
},

builderContacts: [{
    role: {
        type: String,
        enum: [
            'Sales Head',
            'Sales Manager',
            'Sales Executive',
            'Relationship Manager',
            'CRM Executive',
            'Site Engineer',
            'Channel Partner Manager',
            'Marketing Manager',
            'Project Manager',
            'Other'
        ]
    },
    designation: String,
    name: String,
    mobile: String,
    alternateMobile: String,
    email: String,
    isPrimary: {
        type: Boolean,
        default: false
    }
}],

    propertyStatus: {
        type: String,
        default: 'Available'
    },

    floorNumber: Number,

    totalFloors: Number,

    facing: String,

    liftAvailable: String,

    propertyAge: Number,

    coverPhoto: String,

    singleFlatType: String,

    singleCarpetArea: Number,

    singleQuotedPrice: Number,

monthlyRent: {
    type: Number,
    default: 0
},

securityDeposit: {
    type: Number,
    default: 0
},

maintenanceCharges: {
    type: Number,
    default: 0
},

leaseDurationMonths: {
    type: Number,
    default: 0
},


    singleClosingPrice: Number,

    askingPricePerSqFt: Number,

    parkingType: String,

    furnishedStatus: String,

    possessionStatus: String,

    propertyMode: {
        type: String,
        enum: ['PROJECT', 'SINGLE'],
        default: 'PROJECT'
    },

    projectType: {
        type: [String],
        enum: [
            'Residential',
            'Commercial',
            'Mixed Use'
        ],
        default: []
    },

    propertyType: {
        type: [String],
        enum: [
            'Apartment',
            'Villa',
            'Plot',
            'Office',
            'Showroom',
            'Retail',
            'Shop'
        ],
        default: []
    },

    projectStatus: {
        type: String,
        enum: [
            'New Launch',
            'Under Construction',
            'Ready Possession',
            'Resale'
        ]
    },

    reraApproved: {
        type: String,
        enum: [
            'Yes',
            'No'
        ]
    },

    launchDate: Date,

    city: String,

    direction: {
        type: String,
        enum: [
            'East',
            'West',
            'North',
            'South',
            'Central'
        ]
    },

    propertyLocation: String,

    divisionName: String,

    pincode: String,

    district: String,

    stateName: String,

    locationLandmark: String,

    googlePin: String,

    location: {
        type: {
            type: String
        },
        coordinates: [Number]
    },

    numberOfTowers: Number,

    towers: [
        {
            towerName: String,

            numberOfFloors: Number,

            towerStatus: {
                type: String,
                enum: [
                    'Under Construction',
                    'Ready Possession',
                    'Sold Out'
                ]
            },

            inventoryStatus: {
                type: String,
                enum: [
                    'Available',
                    'Limited Availability',
                    'Sold Out'
                ]
            },

            possessionMonth: String,

            possessionYear: Number
        }
    ],

    configurations: [
        {
            flatType: {
                type: String,
                enum: [
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
                ]
            },

            carpetArea: Number,

            quotedPrice: Number,

            closingPrice: Number,

            furnishedStatus: {
                type: String,
                enum: [
                    'Unfurnished',
                    'Semi-Furnished',
                    'Fully Furnished'
                ]
            },

            parkingType: {
                type: [String],
                enum: [
                    'Open',
                    'Covered',
                    'Basement',
                    'Podium',
                    'Stilt'
                ],
                default: []
            },

            possessionStatus: {
                type: [String],
                enum: [
                    'Immediate',
                    'Ready Possession',
                    'Under Construction',
                    'Possession Soon'
                ],
                default: []
            },

            towerName: String,

            availableUnits: Number
        }
    ],

    amenities: [String],

    usp: String,

    notes: String,

    images: [String],

    createdAt: {
        type: Date,
        default: Date.now
    }

})

propertySchema.index({
    location: '2dsphere'
})

module.exports = mongoose.model(
    'Property',
    propertySchema
)