const ChatSession = require("../models/ChatSession");
const ChatMessage = require("../models/ChatMessage");

exports.saveMessage = async (
    tenantId,
    sessionId,
    role,
    message
) => {

await ChatSession.findOneAndUpdate(
    {
        tenantId,
        sessionId
    },
    {
        $set: {
            lastMessageAt: new Date()
        }
    },
    {
        returnDocument: "after"
    }
);

    await ChatMessage.create({
        tenantId,
        sessionId,
        role,
        message
    });

};

exports.getHistory = async (sessionId) => {

const messages = await ChatMessage.find({
    sessionId
})
.sort({ createdAt: -1 })
.limit(20)
.lean();

return messages
    .reverse()
    .map(m => ({
        role: m.role,
        content: m.message
    }));

};