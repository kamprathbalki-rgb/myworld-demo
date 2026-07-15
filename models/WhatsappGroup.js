const mongoose = require('mongoose');

const whatsappGroupSchema = new mongoose.Schema({

tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
},

    groupId: {
        type: String,
        required: true
    },

    groupName: {
        type: String,
        required: true
    },

    active: {
        type: Boolean,
        default: true
    }

});

module.exports =
mongoose.model(
    'WhatsappGroup',
    whatsappGroupSchema
);