const express = require("express");
const router = express.Router();

const ChatLead = require("../models/ChatLead");

router.get(
    "/admin/chat-leads",
    async (req, res) => {

        const tenantId = req.session.tenantId;

        const chatLeads =
            await ChatLead
                .find({ tenantId })
                .sort({ createdAt: -1 });

        res.render(
            "chatLeads",
            {
                chatLeads
            }
        );

    }
);

router.get(
    "/admin/chat-leads/:id",
    async (req, res) => {

        const lead =
            await ChatLead.findById(
                req.params.id
            );

        res.render(
            "chatLeadView",
            {
                lead
            }
        );

    }
);

module.exports = router;