const mongoose = require("mongoose");

const emailVerificationSchema = new mongoose.Schema({

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },

    sessionId: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    code: {
        type: String,
        required: true
    },

    verified: {
        type: Boolean,
        default: false
    },

    expiresAt: {
        type: Date,
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "EmailVerification",
    emailVerificationSchema
);