const mongoose = require('mongoose')

const executiveAttendanceSchema = new mongoose.Schema({

    tenantId: String,

    date: {
        type: String,
        required: true
    },

    executiveId: String,
    executiveName: String,

    loginTimes: [String],
    logoutTimes: [String],

    teaOut: [String],
    teaIn: [String],

    lunchOut: [String],
    lunchIn: [String],

    meetingOut: [String],
    meetingIn: [String],

    siteVisitOut: [String],
    siteVisitIn: [String],

activityLog: [
{
    action: String,
    time: String
}
]

})

executiveAttendanceSchema.index({
    tenantId: 1,
    executiveId: 1,
    date: 1
}, {
    unique: true
})

module.exports = mongoose.model(
    'ExecutiveAttendance',
    executiveAttendanceSchema
)