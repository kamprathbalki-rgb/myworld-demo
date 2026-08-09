const mongoose = require("mongoose");

const tenantAIUsageSchema = new mongoose.Schema({

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
        index: true
    },

    feature: {
        type: String,
        required: true
    },

    model: String,

    promptTokens: {
        type: Number,
        default: 0
    },

    completionTokens: {
        type: Number,
        default: 0
    },

    totalTokens: {
        type: Number,
        default: 0
    },

    reasoningTokens: {
        type: Number,
        default: 0
    },

    cachedTokens: {
        type: Number,
        default: 0
    },

    cacheWriteTokens: {
        type: Number,
        default: 0
    },

    acceptedPredictionTokens: {
        type: Number,
        default: 0
    },

    rejectedPredictionTokens: {
        type: Number,
        default: 0
    },

    requestCount: {
        type: Number,
        default: 1
    },

    estimatedCost: {
        type: Number,
        default: 0
    },

ipAddress: String,

userId: {
    type: mongoose.Schema.Types.ObjectId
},

userName: String,

userType: String,

sessionId: String,

success: {
    type: Boolean,
    default: true
},

error: String,

responseTimeMs: Number,

    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }

});

module.exports = mongoose.model(
    "TenantAIUsage",
    tenantAIUsageSchema
);