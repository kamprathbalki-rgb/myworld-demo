const mongoose = require('mongoose')

const buyerSchema = new mongoose.Schema({

name: String,

phone: String,

email: {
    type: String,
    default: ""
},

whatsappNumber: {
    type: String,
    default: ""
},

isWhatsAppSame: {
    type: Boolean,
    default: true
},

emailStatus: {
    type: String,
    enum: [
        "Verified",
        "Not Available",
        "Will Share Later"
    ],
    default: "Will Share Later"
},

buyingInterest: {
    type: String,
    default: ""
},

notInterestedReason: {
    type: String,
    default: ""
},

boughtBuilder: {
    type: String,
    default: ""
},

purchaseTimeline: {
    type: String,
    default: ""
},

minBudget: Number,

maxBudget: Number,

transactionType:{
type:String,
enum:[
'SALE',
'RENT',
'LEASE'
],
default:'SALE'
},

propertyType: {
    type: String,
    enum: [
        "Apartment",
        "Villa",
        "Plot",
        "Office",
        "Showroom",
        "Retail",
        "Shop"
    ],
    default: "Apartment"
},

requiredFlatType: {
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

minArea: Number,

maxArea: Number,

requiredPossession: [String],

status:{
type:String,
default:"New Lead"
},

followUpNotes:String,

preferredLocations: [String],
preferredPincodes: [String],
preferredDistricts: [String],
preferredDivisionNames: [String],

stateName: String,

preferredLocation: {
    type: {
        type: String,
        default: "Point"
    },
    coordinates: [Number]
},

primaryLocation: {
    type: String,
    default: ""
},

// PreSales Owner
preSalesExecutiveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Executive",
    default: null
},

preSalesExecutiveName: {
    type: String,
    default: ""
},

// Sales Owner
salesExecutiveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Executive",
    default: null
},

buyerNotes: String,

assignmentType: {
    type: String,
    default: "AUTO"
},

tenantId:{
type:mongoose.Schema.Types.ObjectId,
ref:'Tenant'
},

radius: Number,

lastFollowUp: {
    type: Date,
    default: null
},

nextFollowUp: {
    type: Date,
    default: null
},

lastSiteVisitDate: {
    type: Date,
    default: null
},

siteVisitDate: {
    type: Date,
    default: null
},

emailVerified: {
    type: Boolean,
    default: false
},

mobileVerified: {
    type: Boolean,
    default: false
},

leadOrigin: {
    type: String,
    default: "Manual"
},

leadSource: {
    type: String,
    default: "Manual"
},

createdByRole: {
    type: String,
    enum: [
        "Admin",
        "Executive",
        "PreSales",
        "System"
    ],
    default: "Admin"
},

createdById: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
},

createdByName: {
    type: String,
    default: ""
},

currentOwnerRole: {
    type: String,
    enum: [
        "PreSales",
        "Executive",
        "PostSales"
    ],
    default: "Executive"
},

// Department owning the buyer
department: {
    type: String,
    enum: [
        "PreSales",
        "Sales"
    ],
    default: "PreSales"
},

salesExecutiveName: {
    type: String,
    default: ""
},

// Date of handover
handoverDate: {
    type: Date
},

// Admin / Auto / Manual
handoverMode: {
    type: String,
    default: "AUTO"
},

chatSessionId: {
    type: String,
    default: ""
},

chatLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatLead",
    default: null
},

qualificationDate: {
    type: Date,
    default: null
},

createdAt: {
    type: Date,
    default: Date.now
},

buyerValue: {
    type: Number,
    default: null
},

buyerValueConfirmedBy: {
    type: String,
    default: ""
},

negotiationStatus: {
    type: String,
    default: ""
},

buyerValueConfirmedAt: {
    type: Date,
    default: null
}
},

{
    timestamps: true
})

/*
|--------------------------------------------------------------------------
| MongoDB Indexes
|--------------------------------------------------------------------------
*/

// General tenant lookup
buyerSchema.index({
    tenantId: 1
});

// Duplicate mobile validation
buyerSchema.index({
    tenantId: 1,
    phone: 1
});

// Status filters
buyerSchema.index({
    tenantId: 1,
    status: 1
});

// Executive-wise buyers
buyerSchema.index({
    tenantId: 1,
    assignedExecutiveId: 1
});

// Follow-up reports
buyerSchema.index({
    tenantId: 1,
    nextFollowUp: 1
});

// Location search
buyerSchema.index({
    tenantId: 1,
    primaryLocation: 1
});

// Unqualified Leads
buyerSchema.index({
    tenantId: 1,
    leadSource: 1,
    currentOwnerRole: 1
});

// Dashboard sorting
buyerSchema.index({
    tenantId: 1,
    createdAt: -1
});

module.exports = mongoose.model('Buyer', buyerSchema)