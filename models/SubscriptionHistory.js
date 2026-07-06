const mongoose = require('mongoose')

const subscriptionHistorySchema =
new mongoose.Schema({

tenantId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Tenant'
},

tenantName:String,

action:String,

months:Number,

oldExpiryDate:Date,

newExpiryDate:Date,

performedBy:String,

createdAt:{
    type:Date,
    default:Date.now
}

})

module.exports =
mongoose.model(
    'SubscriptionHistory',
    subscriptionHistorySchema
)