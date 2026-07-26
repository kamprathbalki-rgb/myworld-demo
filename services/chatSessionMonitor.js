const ChatSession = require("../models/ChatSession");
const chatHistoryService = require("./chatHistoryService");
const ChatLead = require("../models/ChatLead");

exports.checkIdleSessions = async () => {

    const now = new Date();

    const sessions = await ChatSession.find({
        status: "Active"
    });

    for (const session of sessions) {

        const idleMinutes =
            (now - session.lastMessageAt) / 60000;

if (
    session.idleWarningSent &&
    idleMinutes >= 2
) {

    session.status = "Closed";

    session.idleWarningSent = false;

    session.pendingBotMessage =
        "Since I haven't heard from you, this chat has ended.\n\nFeel free to start a new conversation anytime.";

    await session.save();

    await ChatLead.updateOne(
        {
            tenantId: session.tenantId,
            sessionId: session.sessionId
        },
        {
            status: "Abandoned"
        }
    );
}

        if (
            session.idleWarningSent &&
            idleMinutes >= 2
        ) {

await chatHistoryService.saveMessage(
    session.tenantId,
    session.sessionId,
    "assistant",
    "Since I haven't heard from you, This chat has ended.\n\nFeel free to start a new conversation anytime."
);

session.status = "Closed";
session.idleWarningSent = false;

await session.save();

            await ChatLead.updateOne(
                {
                    tenantId: session.tenantId,
                    sessionId: session.sessionId
                },
                {
                    status: "Abandoned"
                }
            );
        }
    }
};