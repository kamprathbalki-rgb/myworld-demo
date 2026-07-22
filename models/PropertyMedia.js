const mongoose = require("mongoose");

const mediaItemSchema = new mongoose.Schema(
{
    filename: {
        type: String,
        trim: true
    },

    originalName: {
        type: String,
        trim: true
    },

    relativePath: {
        type: String,
        trim: true
    },

    uploadedAt: {
        type: Date,
        default: Date.now
    }
},
{
    _id: false
}
);

const propertyMediaSchema = new mongoose.Schema({

    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true,
        unique: true
    },

    projectName: {
        type: String,
        required: true,
        trim: true
    },

    coverPhoto: mediaItemSchema,

    /*
        Structure

        configurationPhotos = {
            "1 BHK": {
                "Living Room": [],
                "Bedroom": [],
                "Kitchen": [],
                "Bathroom": [],
                "Balcony": []
            },

            "Studio": {
                "Living / Sleeping Area": [],
                "Kitchenette": [],
                "Bathroom": []
            }
        }
    */

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

    builderDocuments: {
        type: [mediaItemSchema],
        default: []
    }

},
{
    timestamps: true
});

module.exports = mongoose.model("PropertyMedia", propertyMediaSchema);