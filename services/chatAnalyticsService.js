const ChatMessage = require("../models/ChatMessage");

exports.getStats = async (tenantId) => {

    const totalMessages =
        await ChatMessage.countDocuments({
            tenantId
        });

    const userMessages =
        await ChatMessage.countDocuments({
            tenantId,
            role: "user"
        });

    const botMessages =
        await ChatMessage.countDocuments({
            tenantId,
            role: "assistant"
        });

    return {
        totalMessages,
        userMessages,
        botMessages
    };

};