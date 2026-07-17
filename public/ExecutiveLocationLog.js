const mongoose = require('mongoose')

const executiveLocationLogSchema =
new mongoose.Schema({

    executiveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Executive'
    },

    executiveName: String,

    attendanceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExecutiveAttendance'
    },

    type: String,

    latitude: Number,

    longitude: Number,

    accuracy: Number,

    timestamp: {
        type: Date,
        default: Date.now
    }

})

module.exports =
mongoose.model(
    'ExecutiveLocationLog',
    executiveLocationLogSchema
)