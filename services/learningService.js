const mongoose =
require('mongoose');

const LearningCorrection =
require('../models/LearningCorrection');

async function getLearningExamples() {

    if (
        mongoose.connection.readyState !== 1
    ) {
        return [];
    }

    return await LearningCorrection
        .find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

}

module.exports = {
    getLearningExamples
};