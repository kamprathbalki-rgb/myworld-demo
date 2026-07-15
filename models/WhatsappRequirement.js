const mongoose =
require('mongoose');

const whatsappRequirementSchema =
new mongoose.Schema({

tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
},

whatsappMessageId: {
    type: String
},

    groupName: String,

    message: String,

messageId: {
    type: String,
    unique: true,
    sparse: true
},

propertyType: String,

sender: String,

senderId: String,
senderName: String,
senderPhone: String,

transactionType: String,

bhk: Number,

location: String,

area: Number,

areaUnit: String,

budget: mongoose.Schema.Types.Mixed,

contactNumbers: [String],

confidence: Number,

summary: String,


    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports =
mongoose.model(
    'WhatsappRequirement',
    whatsappRequirementSchema
);