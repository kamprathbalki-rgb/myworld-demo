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

            callsMade:
                workflow.filter(w =>
                    w.previousStatus === "Imported" &&
                    w.newStatus === "Phone Call"
                ).length,

            qualified:
                workflow.filter(w =>
                    w.previousStatus === "Phone Call" &&
                    w.newStatus === "Qualified"
                ).length,

            siteVisitConversions:
                workflow.filter(w =>
                    w.previousStatus === "Qualified" &&
                    w.newStatus === "Site Visit"
                ).length,

            negotiationConversions:
                workflow.filter(w =>
                    w.previousStatus === "Site Visit" &&
                    w.newStatus === "Negotiation"
                ).length,

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

            followUpsThisWeek:
                followUps,

            siteVisitsThisWeek:
                siteVisits

        };

        res.render(
            "dailyReport",
            {
                session: req.session,
                report
            }
        );

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