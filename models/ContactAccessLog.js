const mongoose = require('mongoose')

const contactAccessLogSchema = new mongoose.Schema({

    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Buyer'
    },

    executiveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Executive'
    },

    executiveName: String,

    accessTime: {
        type: Date,
        default: Date.now
    },

    reason: {
        type: String,
        default: "Buyer Contact Unlock"
    },

    ipAddress: String,

    deviceInfo: String

})

module.exports = mongoose.model(
    'ContactAccessLog',
    contactAccessLogSchema
)