const mongoose = require("mongoose");

const chatSessionSchema = new mongoose.Schema({

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },

    sessionId: {
        type: String,
        required: true,
        index: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

collectLead: {
    type: Boolean,
    default: null
},

anonymous: {
    type: Boolean,
    default: false
},

leadStep:{
    type:String,
enum: [
    "NAME",
    "MOBILE",
    "MOBILE_CONFIRM",
    "EMAIL",
    "EMAIL_CONFIRM",
    "EMAIL_VERIFICATION",
    "COMPLETED"
],
    default:null
},

mobileConfirmAttempts: {
    type: Number,
    default: 0
},

mobileEntryAttempts: {
    type: Number,
    default: 0
},

emailConfirmAttempts: {
    type: Number,
    default: 0
},
lastMessageAt: {
    type: Date,
    default: Date.now
},

idleWarningSent: {
    type: Boolean,
    default: false
},

pendingBotMessage: {
    type: String,
    default: ""
},

status: {
    type: String,
    enum: ["Active", "Closed"],
    default: "Active"
}

});

module.exports = mongoose.model(
    "ChatSession",
    chatSessionSchema
);