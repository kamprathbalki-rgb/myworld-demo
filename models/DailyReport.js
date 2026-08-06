const mongoose = require("mongoose");

const dailyReportSchema = new mongoose.Schema({

    reportDate: Date,

    executiveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Executive"
    },

    executiveName: String,

    loginTime: Date,

    logoutTime: Date,

    workingMinutes: Number,

    openingPending: Number,

    newAssigned: Number,

    handled: Number,

    pending: Number,

    callsMade: Number,

    connected: Number,

    notReachable: Number,

    busy: Number,

    switchedOff: Number,

    wrongNumber: Number,

    invalidNumber: Number,

    notInterested: Number,

    importedToPhone: Number,

    phoneToQualified: Number,

    qualifiedToSiteVisit: Number,

    siteVisitToNegotiation: Number,

    negotiationToWon: Number,

    negotiationToLost: Number,

    followupDue: Number,

    followupCompleted: Number,

    followupMissed: Number,

    followupTomorrow: Number,

    siteVisitScheduled: Number,

    siteVisitCompleted: Number,

    siteVisitCancelled: Number,

    siteVisitRescheduled: Number,

    buyersInNegotiation: Number,

    totalBuyerValue: Number,

    highestBuyerValue: Number,

    averageBuyerValue: Number,

    dealsWon: Number,

    dealsLost: Number,

    revenue: Number,

    callsPerHour: Number,

    qualificationRate: Number,

    siteVisitRate: Number,

    negotiationRate: Number,

    overdueFollowups: Number,

    overdueSiteVisits: Number,

    waitingQualification: Number,

    waitingNegotiation: Number,

    majorIssues: String,

    customerFeedback: String,

    supportRequired: String,

    tomorrowPlan: String

},{
    timestamps:true
});

module.exports = mongoose.model(
    "DailyReport",
    dailyReportSchema
);