const mongoose = require('mongoose')

const buyerSchema = new mongoose.Schema({

name: String,

phone: String,

email: String,

minBudget: Number,

maxBudget: Number,

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

assignmentType: {
    type: String,
    default: "AUTO"
},

tenantId:{
type:mongoose.Schema.Types.ObjectId,
ref:'Tenant'
},

radius: Number,

assignedExecutiveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Executive',
    default: null
},

assignedExecutiveName: {
    type: String,
    default: ""
},

nextFollowUp: {
    type: Date,
    default: null
},

siteVisitDate:{
    type:Date
},

dealValue:{
    type:Number,
    default:0
},

dealClosedDate:{
    type:Date
},

lostValue:{
    type:Number,
    default:0
},

lostDate:{
    type:Date
},

createdAt: {
    type: Date,
    default: Date.now
}

})

module.exports = mongoose.model('Buyer', buyerSchema)