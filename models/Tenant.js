const mongoose = require('mongoose')

const tenantSchema = new mongoose.Schema({

name:String,

email:String,

adminName:String,

adminEmail:String,

stateName:{
    type:String,
    required:true
},

primaryDistrict:{
    type:String,
    required:true
},

subscriptionMonths:{
    type:Number,
    default:12
},

subscriptionStartDate:{
    type:Date,
    default:Date.now
},

subscriptionEndDate:{
    type:Date
},

isActive:{
    type:Boolean,
    default:true
},

createdAt:{
type:Date,
default:Date.now
}

})

module.exports = mongoose.model('Tenant',tenantSchema)