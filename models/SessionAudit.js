const mongoose = require("mongoose");

const SessionAuditSchema = new mongoose.Schema({

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        index: true
    },

    userType: String,          // Admin / Executive

    userId: mongoose.Schema.Types.ObjectId,

    userName: String,

    event: String,             // LOGIN, LOGOUT, SESSION_EXPIRED, INVALID_SESSION, AUTO_LOGOUT

    ip: String,

    userAgent: String,

    sessionId: String

}, {
    timestamps: true
});

module.exports = mongoose.model("SessionAudit", SessionAuditSchema);