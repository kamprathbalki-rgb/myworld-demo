const tenantService = require("../services/tenantService");
const chatAnalyticsService = require("../services/chatAnalyticsService");
const ChatLead = require("../models/ChatLead");

exports.dashboard = async (req, res) => {

    const tenant =
        await tenantService.findBySlug(
            req.params.tenant
        );

    const stats =
        await chatAnalyticsService.getStats(
            tenant._id
        );

    const leads =
        await ChatLead.find({
            tenantId: tenant._id
        })
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean();

    res.render("chatbot/adminDashboard", {
        tenant,
        stats,
        leads
    });

};