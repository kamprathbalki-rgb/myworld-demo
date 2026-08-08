const mongoose = require("mongoose");

const applicationLogSchema = new mongoose.Schema({

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant"
    },

    userType: {
        type: String,
        default: ""
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId
    },

    userName: {
        type: String,
        default: ""
    },

    action: {
        type: String,
        default: ""
    },

    ip: {
        type: String,
        default: ""
    },

    userAgent: {
        type: String,
        default: ""
    },

    sessionId: {
        type: String,
        default: ""
    },

    remarks: {
        type: String,
        default: ""
    }

},{
    timestamps:true
});

module.exports =
mongoose.model(
    "ApplicationLog",
    applicationLogSchema
);