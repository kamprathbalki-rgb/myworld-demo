const mongoose =
require('mongoose');

const keywordMasterSchema =
new mongoose.Schema({

    type: String,

    keyword: String,

    active: {
        type: Boolean,
        default: true
    }

});

module.exports =
mongoose.model(
    'KeywordMaster',
    keywordMasterSchema
);