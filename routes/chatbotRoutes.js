const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");

router.get("/:tenant/chat", chatbotController.showChat);

router.post("/:tenant/chat/message", chatbotController.chat);

router.get("/:tenant/chat/messages/:sessionId", chatbotController.getMessages);

module.exports = router;