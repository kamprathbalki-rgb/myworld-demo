const mongoose = require("mongoose");

const mediaItemSchema = new mongoose.Schema({
    placeholder: {
        type: String,
        trim: true
    },
    filename: {
        type: String,
        trim: true
    },
    originalName: {
        type: String,
        trim: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const propertyMediaSchema = new mongoose.Schema({

    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true,
        unique: true
    },

    coverPhoto: mediaItemSchema,

    configurationPhotos: {
        type: Map,
        of: [mediaItemSchema],
        default: {}
    },

    amenityPhotos: {
        type: [mediaItemSchema],
        default: []
    },

    uspPhotos: {
        type: [mediaItemSchema],
        default: []
    },

propertyVideo: mediaItemSchema,

builderDocuments: [mediaItemSchema]


}, {
    timestamps: true
});

module.exports = mongoose.model("PropertyMedia", propertyMediaSchema);