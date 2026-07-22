const express = require("express");
const router = express.Router();

const upload = require("../middleware/propertyMediaUpload");

const Property = require("../models/Property");

const PropertyMedia = require("../models/PropertyMedia");

const mediaLimits = require("../data/propertyMediaLimits");

router.get("/:propertyId", async (req, res) => {

    const property = await Property.findById(req.params.propertyId);

    let media = await PropertyMedia.findOne({
        property: req.params.propertyId
    });

    if (!media) {
        media = new PropertyMedia({
            property: req.params.propertyId
        });
    }

    res.render("propertyMedia", {
        property,
        media,
        mediaLimits
    });

});

router.post(
    "/:propertyId/upload",

    upload.fields([
        { name: "coverPhoto", maxCount: 1 },
        { name: "propertyVideo", maxCount: 1 },
        { name: "builderDocuments", maxCount: 5 },
        { name: "amenityPhotos", maxCount: 7 },
        { name: "uspPhotos", maxCount: 3 },

        { name: "configuration_Studio", maxCount: 5 },
        { name: "configuration_1 RK", maxCount: 5 },
        { name: "configuration_1 BHK", maxCount: 6 },
        { name: "configuration_1.5 BHK", maxCount: 7 },
        { name: "configuration_2 BHK", maxCount: 8 },
        { name: "configuration_2.5 BHK", maxCount: 9 },
        { name: "configuration_3 BHK", maxCount: 10 },
        { name: "configuration_3.5 BHK", maxCount: 11 },
        { name: "configuration_4 BHK", maxCount: 12 },
        { name: "configuration_4.5 BHK", maxCount: 13 },
        { name: "configuration_5 BHK", maxCount: 14 },
        { name: "configuration_5+ BHK", maxCount: 14 },
        { name: "configuration_Villa", maxCount: 15 },
        { name: "configuration_Plot", maxCount: 4 },
        { name: "configuration_Office", maxCount: 8 },
        { name: "configuration_Showroom", maxCount: 8 },
        { name: "configuration_Retail", maxCount: 8 },
        { name: "configuration_Shop", maxCount: 5 }
    ]),

    async (req, res) => {

        try {

            // Save logic will be added next.

let media = await PropertyMedia.findOne({
    property: req.params.propertyId
});

if (!media) {

    media = new PropertyMedia({
        property: req.params.propertyId
    });

}

if (req.files.coverPhoto) {

    media.coverPhoto = {
        filename: req.files.coverPhoto[0].filename,
        originalName: req.files.coverPhoto[0].originalname
    };

}

Object.keys(req.files).forEach(field => {

    if (!field.startsWith("configuration_")) return;

    const configuration = field.replace("configuration_", "");

    media.configurationPhotos.set(
        configuration,
        req.files[field].map(file => ({
            filename: file.filename,
            originalName: file.originalname
        }))
    );

});

if (req.files.amenityPhotos) {

    media.amenityPhotos = req.files.amenityPhotos.map(file => ({
        filename: file.filename,
        originalName: file.originalname
    }));

}

if (req.files.uspPhotos) {

    media.uspPhotos = req.files.uspPhotos.map(file => ({
        filename: file.filename,
        originalName: file.originalname
    }));

}

if (req.files.propertyVideo) {

    media.propertyVideo = {
        filename: req.files.propertyVideo[0].filename,
        originalName: req.files.propertyVideo[0].originalname
    };

}

if (req.files.builderDocuments) {

    media.builderDocuments = req.files.builderDocuments.map(file => ({
        filename: file.filename,
        originalName: file.originalname
    }));

}

await media.save();

res.redirect("/property-media/" + req.params.propertyId);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false,
                message: err.message
            });

        }

    }
);

module.exports = router;