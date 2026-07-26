const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema({

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },

    question: {
        type: String,
        required: true,
        trim: true
    },

    answer: {
        type: String,
        required: true,
        trim: true
    },

    keywords: [{
        type: String,
        trim: true
    }],

    active: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }

});

faqSchema.pre("save", function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("FAQ", faqSchema);