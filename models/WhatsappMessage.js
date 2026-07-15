const mongoose = require('mongoose');

const whatsappMessageSchema = new mongoose.Schema({

aiData: {
    type: Object,
    default: {}
},

tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
},

    groupId: String,

    groupName: String,

    sender: String,

    message: String,

messageId: {
    type: String,
    unique: true,
    sparse: true
},

classification: {
    type: String,
    default: 'OTHER'
},

    processed: {
        type: Boolean,
        default: false
    },

aiProcessedAt: {
    type: Date
},

aiUsage: {
    type: Object,
    default: {}
},


    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports =
mongoose.model(
    'WhatsappMessage',
    whatsappMessageSchema
);