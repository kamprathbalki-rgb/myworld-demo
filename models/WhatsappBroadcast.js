const mongoose = require('mongoose');

const whatsappBroadcastSchema =
new mongoose.Schema({

tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
},

    sender: String,

    message: String,

    processed: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports =
mongoose.model(
    'WhatsappBroadcast',
    whatsappBroadcastSchema
);