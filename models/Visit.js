const mongoose = require('mongoose')

const visitSchema = new mongoose.Schema({

propertyId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Property'
},

buyerId: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Buyer'
},

tenantId:{
type:mongoose.Schema.Types.ObjectId,
ref:'Tenant'
},

executiveName: String,

scheduledVisitDate: Date,

rescheduledFrom: Date,

status: {
    type: String,
    enum: [
        'Scheduled',
        'Rescheduled',
        'Completed',
        'Cancelled',
        'No Show'
    ],
    default: 'Scheduled'
},

visitHistory: [
  {
    oldDate: Date,
    newDate: Date,
    changedAt: Date,
    changedBy: String
  }
],

dealClosed:{
type:Boolean,
default:false
},

feedback: String,

createdAt: {
type: Date,
default: Date.now
}

})

module.exports = mongoose.model('Visit', visitSchema)