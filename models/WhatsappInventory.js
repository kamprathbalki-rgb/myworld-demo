const mongoose =
require('mongoose');

const whatsappInventorySchema =
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

transactionType: String,

sender: String,

senderId: String,
senderName: String,
senderPhone: String,

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
    'WhatsappInventory',
    whatsappInventorySchema
);