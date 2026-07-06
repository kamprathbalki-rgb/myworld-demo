const mongoose = require('mongoose')

const locationMasterSchema = new mongoose.Schema({

lat: Number,

lng: Number,

officeName: String,

pincode: String,

divisionName: String,

district: String,

stateName: String

})

module.exports = mongoose.model(
'LocationMaster',
locationMasterSchema
)