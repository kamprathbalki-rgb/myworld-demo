const express = require("express");

const router = express.Router();

const chatbotAdminController =
    require("../controllers/chatbotAdminController");

router.get(
    "/:tenant/chat/admin",
    chatbotAdminController.dashboard
);

module.exports = router;