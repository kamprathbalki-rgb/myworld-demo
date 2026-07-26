const chatbotService = require("../services/chatbotService");
const ChatMessage = require("../models/ChatMessage");
const ChatSession = require("../models/ChatSession");


exports.showChat = (req, res) => {
    res.render("chatbot/index", {
        tenant: req.params.tenant
    });
};

exports.chat = async (req, res) => {

    const { message, sessionId } = req.body;

    const tenant = req.params.tenant;

    const result = await chatbotService.reply(
        tenant,
        sessionId,
        message
    );

    res.json(result);

};

exports.getMessages = async (req, res) => {

    const messages = await ChatMessage
        .find({
            sessionId: req.params.sessionId,
            role: "assistant"
        })
        .sort({ createdAt: 1 })
        .limit(1);

    res.json({
        messages
    });

};

exports.endSession = async (req, res) => {

    const { sessionId } = req.body;

    await ChatSession.findOneAndUpdate(
        { sessionId },
        {
            status: "Closed",
            endedAt: new Date()
        }
    );

    res.json({ success: true });

};
