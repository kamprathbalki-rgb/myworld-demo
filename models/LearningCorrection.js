const mongoose =
require('mongoose');

const learningCorrectionSchema =
new mongoose.Schema({

tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    index: true
},

originalMessage: {
    type: String,
    required: true
},

aiOutput: {
    type: Object,
    required: true
},

correctedOutput: {
    type: Object,
    required: true
},

createdAt: {
    type: Date,
    default: Date.now
}

});

module.exports =
mongoose.model(
    'LearningCorrection',
    learningCorrectionSchema
);