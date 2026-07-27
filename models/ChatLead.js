const mongoose = require("mongoose");

const chatLeadSchema = new mongoose.Schema({

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },

    sessionId: {
        type: String,
        required: true
    },

    // Contact Information
    name: String,

    mobile: String,

    email: String,

    mobileVerified: {
        type: Boolean,
        default: false
    },

    emailVerified: {
        type: Boolean,
        default: false
    },

    verificationRequestedAt: Date,

    // Property Requirement
propertyCategory: String,

purpose: String,

location: String,

propertyType: String,

projectStatus: String,

transactionType: String,

possessionStatus: String,

configuration: String,

budget: String,

timeline: String,

    // Conversation
    guestMode: {
        type: Boolean,
        default: false
    },
emailVerificationAttempts: {
    type: Number,
    default: 0
},

mobileVerificationAttempts: {
    type: Number,
    default: 0
},


mobileDeclined: {
    type: Boolean,
    default: false
},

emailDeclined: {
    type: Boolean,
    default: false
},

nameDeclined: {
    type: Boolean,
    default: false
},

nameAsked: {
    type: Boolean,
    default: false
},

emailAsked: {
    type: Boolean,
    default: false
},

mobileAsked: {
    type: Boolean,
    default: false
},

leadOrigin: {
    type: String,
    default: "AIChatBot"
},

mobileValidationAttempts: {
    type: Number,
    default: 0
},

emailValidationAttempts: {
    type: Number,
    default: 0
},

awaitingMobileConfirmation: {
    type: Boolean,
    default: false
},

awaitingEmailConfirmation: {
    type: Boolean,
    default: false
},
    status: {
        type: String,
        default: "Open"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "ChatLead",
    chatLeadSchema
);