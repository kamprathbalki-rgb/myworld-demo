const mongoose = require('mongoose')

const executiveSchema = new mongoose.Schema({

    name: String,

    mobile: String,

    email: {
        type: String,
        unique: true
    },

dateOfJoining: String,

dateOfLeaving: String,

    password: String,

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant'
    },

    assignedLocations: [String],

    isActive: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

})

module.exports = mongoose.model('Executive', executiveSchema)
