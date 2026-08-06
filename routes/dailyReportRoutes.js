const express = require("express");
const router = express.Router();

const DailyReport = require("../models/DailyReport");
const Buyer = require("../models/Buyer");
const Executive = require("../models/Executive");

const BuyerWorkflowHistory =
require("../models/BuyerWorkflowHistory");

const BuyerProjectVisit =
require("../models/BuyerProjectVisit");

const ExecutiveAttendance =
require("../models/ExecutiveAttendance");

const { isLoggedIn } =
require("../middleware/auth");

router.get(
    "/executive/daily-report",
    isLoggedIn,
    async (req, res) => {

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const executiveId = req.session.executiveId;

        const attendance =
            await ExecutiveAttendance.findOne({
                executiveId,
                date: today.toISOString().slice(0, 10)
            });

        const workflow =
            await BuyerWorkflowHistory.find({

                changedById: executiveId,

                changedAt: {
                    $gte: today,
                    $lt: tomorrow
                }

            });

        const followUps =
            await Buyer.countDocuments({

                preSalesExecutiveId: executiveId,

                nextFollowUp: {
                    $gte: today,
                    $lt: weekEnd
                }

            });

        const siteVisits =
            await BuyerProjectVisit.countDocuments({

                executiveId,

                scheduledVisitDate: {
                    $gte: today,
                    $lt: weekEnd
                }

            });

const openingPending =
await Buyer.countDocuments({

    tenantId:req.session.tenantId,

    preSalesExecutiveId:executiveId,

    status:{
        $nin:[
            "Deal Won",
            "Lost"
        ]
    }

});

const newAssigned =
await Buyer.countDocuments({

    tenantId:req.session.tenantId,

    preSalesExecutiveId:executiveId,

    createdAt:{
        $gte:today,
        $lt:tomorrow
    }

});

const handled =
workflow.length;

const pending =
await Buyer.countDocuments({

    tenantId:req.session.tenantId,

    preSalesExecutiveId:executiveId,

    status:{
        $nin:[
            "Deal Won",
            "Lost"
        ]
    }

});


const connected =
await Buyer.countDocuments({

    tenantId:req.session.tenantId,

    preSalesExecutiveId:executiveId,

    status:"Phone Call"

});

const notReachable =
await Buyer.countDocuments({

    tenantId:req.session.tenantId,

    preSalesExecutiveId:executiveId,

    callStatus:"Not Reachable"

});

const busy =
await Buyer.countDocuments({

    tenantId:req.session.tenantId,

    preSalesExecutiveId:executiveId,

    callStatus:"Busy"

});

const switchedOff =
await Buyer.countDocuments({

    tenantId:req.session.tenantId,

    preSalesExecutiveId:executiveId,

    callStatus:"Switched Off"

});

const wrongNumber =
await Buyer.countDocuments({

    tenantId:req.session.tenantId,

    preSalesExecutiveId:executiveId,

    callStatus:"Wrong Number"

});

const invalidNumber =
await Buyer.countDocuments({

    tenantId:req.session.tenantId,

    preSalesExecutiveId:executiveId,

    callStatus:"Invalid Number"

});

const notInterested =
await Buyer.countDocuments({

    tenantId:req.session.tenantId,

    preSalesExecutiveId:executiveId,

    callStatus:"Not Interested"

});



        const report = {

    executiveName:
        req.session.executiveName,

    reportDate: today,

    loginTime:
        attendance?.loginLocations?.[0]?.time || "",

    logoutTime:
        attendance?.logoutLocations?.[
            attendance.logoutLocations.length - 1
        ]?.time || "",

    workingMinutes: 0,

    openingPending,

    newAssigned,

    handled,

    pending,

    callsMade:
        workflow.filter(w =>
            w.previousStatus === "Imported" &&
            w.newStatus === "Phone Call"
        ).length,

    connected,

    notReachable,

    busy,

    switchedOff,

    wrongNumber,

    invalidNumber,

    notInterested,

    importedToPhone:
        workflow.filter(w =>
            w.previousStatus === "Imported" &&
            w.newStatus === "Phone Call"
        ).length,

    phoneToQualified:
        workflow.filter(w =>
            w.previousStatus === "Phone Call" &&
            w.newStatus === "Qualified"
        ).length,

    qualifiedToSiteVisit:
        workflow.filter(w =>
            w.previousStatus === "Qualified" &&
            w.newStatus === "Site Visit"
        ).length,

    siteVisitToNegotiation:
        workflow.filter(w =>
            w.previousStatus === "Site Visit" &&
            w.newStatus === "Negotiation"
        ).length,

    negotiationToWon:
        workflow.filter(w =>
            w.previousStatus === "Negotiation" &&
            w.newStatus === "Deal Won"
        ).length,

    negotiationToLost:
        workflow.filter(w =>
            w.previousStatus === "Negotiation" &&
            w.newStatus === "Lost"
        ).length,

    followupDue: 0,

    followupCompleted: 0,

    followupMissed: 0,

    followupTomorrow: 0,

    siteVisitScheduled: 0,

    siteVisitCompleted: 0,

    siteVisitCancelled: 0,

    siteVisitRescheduled: 0,

    buyersInNegotiation: 0,

    totalBuyerValue: 0,

    highestBuyerValue: 0,

    averageBuyerValue: 0,

    dealsWon:
        workflow.filter(w =>
            w.previousStatus === "Negotiation" &&
            w.newStatus === "Deal Won"
        ).length,

    dealsLost:
        workflow.filter(w =>
            w.previousStatus === "Negotiation" &&
            w.newStatus === "Lost"
        ).length,

    revenue: 0,

    callsPerHour: 0,

    qualificationRate: 0,

    siteVisitRate: 0,

    negotiationRate: 0,

    overdueFollowups: 0,

    overdueSiteVisits: 0,

    waitingQualification: 0,

    waitingNegotiation: 0,

    majorIssues: "",

    customerFeedback: "",

    supportRequired: "",

    tomorrowPlan: ""

};

res.render("dailyReport", {
    session: req.session,
    report
});

    }
);

router.post("/executive/daily-report", async (req, res) => {

    // save report

});

router.get("/admin/daily-reports", async (req, res) => {

    // list reports

});

router.get("/admin/daily-report/:id", async (req, res) => {

    // view report

});

router.get("/hr/daily-reports", async (req, res) => {

    // list reports

});

router.get("/hr/daily-report/:id", async (req, res) => {

    // view report

});

module.exports = router;