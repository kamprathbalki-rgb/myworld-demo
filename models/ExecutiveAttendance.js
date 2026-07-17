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

loginLocations: [{
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    distanceFromOffice: Number,
    insideOfficeRadius: Boolean,
    time: String
}],

logoutLocations: [{
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    distanceFromOffice: Number,
    insideOfficeRadius: Boolean,
    time: String
}],

teaOutLocations: [{
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    time: String
}],

teaInLocations: [{
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    time: String
}],

lunchOutLocations: [{
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    time: String
}],

lunchInLocations: [{
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    time: String
}],

meetingOutLocations: [{
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    time: String
}],

meetingInLocations: [{
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    time: String
}],

siteVisitOutLocations: [{
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    time: String
}],

siteVisitInLocations: [{
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    time: String
}],

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