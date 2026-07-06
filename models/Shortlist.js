const mongoose = require('mongoose')

const shortlistSchema = new mongoose.Schema({

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

createdAt:{
type:Date,
default:Date.now
}

})

module.exports = mongoose.model('Shortlist',shortlistSchema)