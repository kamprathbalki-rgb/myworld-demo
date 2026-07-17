const mongoose = require('mongoose')

const officeLocationSchema =
new mongoose.Schema({

tenantId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Tenant',
    required:true
},

    officeName: String,

    latitude: Number,

    longitude: Number,

    accuracy: Number,

    radiusMeters: {
        type: Number,
        default: 100
    },

    captureMethod: String,

    active: {
        type: Boolean,
        default: true
    }

})

module.exports =
mongoose.model(
    'OfficeLocation',
    officeLocationSchema
)