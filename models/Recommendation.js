const mongoose = require('mongoose')

const recommendationSchema = new mongoose.Schema({

buyerId:{
type:mongoose.Schema.Types.ObjectId,
ref:'Buyer'
},

propertyId:{
type:mongoose.Schema.Types.ObjectId,
ref:'Property'
},

tenantId:{
type:mongoose.Schema.Types.ObjectId,
ref:'Tenant'
},

score:Number,

createdAt:{
type:Date,
default:Date.now
}

})

module.exports = mongoose.model('Recommendation',recommendationSchema)