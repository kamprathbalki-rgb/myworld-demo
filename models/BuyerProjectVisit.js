const mongoose = require('mongoose')

const buyerProjectVisitSchema = new mongoose.Schema({

    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Buyer'
    },

    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property'
    },

    projectName: String,

    executiveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Executive'
    },

    executiveName: String,

    visitType: {
        type: String,
        enum: [
            'First Visit',
            'Revisit',
            'Rejected',
            'Shortlisted',
            'Negotiation'
        ]
    },

tenantId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Tenant'
},

scheduledVisitDate: Date,

rescheduledFrom: Date,

    remarks: String,

    buyerFeedback: String,

    builderFeedback: String,

    nextAction: String

}, {
    timestamps: true
})

module.exports = mongoose.model(
    'BuyerProjectVisit',
    buyerProjectVisitSchema
)