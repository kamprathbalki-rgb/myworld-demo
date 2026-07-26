const ChatMessage = require("../models/ChatMessage");

exports.getHistory = async (sessionId, limit = 10) => {

    const messages = await ChatMessage
        .find({ sessionId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    return messages
        .reverse()
        .map(m => ({
            role: m.role,
            content: m.message
        }));

};

exports.saveMessage = async (
    tenantId,
    sessionId,
    role,
    message
) => {

    await ChatMessage.create({
        tenantId,
        sessionId,
        role,
        message
    });

};