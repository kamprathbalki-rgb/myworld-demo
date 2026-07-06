const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({

name:String,

email:String,

password:String,

role:{
type:String,
enum:['admin','executive','customer','saasadmin']
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

module.exports = mongoose.model('User',userSchema)