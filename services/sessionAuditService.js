const SessionAudit = require("../models/SessionAudit");

async function auditSession(data) {

    try {

        await SessionAudit.create({

            tenantId: data.tenantId,

            userType: data.userType,

            userId: data.userId,

            userName: data.userName,

            event: data.event,

            ip: data.ip,

            userAgent: data.userAgent,

            sessionId: data.sessionId

        });

    } catch (err) {

        console.error("Session Audit:", err.message);

    }

}

module.exports = { auditSession };