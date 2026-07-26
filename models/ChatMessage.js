const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({

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

    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
    },

    message: {
        type: String,
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "ChatMessage",
    chatMessageSchema
);