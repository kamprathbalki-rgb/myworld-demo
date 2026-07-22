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
    property: req.params.propertyId,
    projectName: property.projectName
});
    }

    res.render("propertyMedia", {
        property,
        media,
        mediaLimits
    });

});

router.post("/:propertyId/upload", async (req, res, next) => {

    try {

        req.property = await Property.findById(req.params.propertyId);

        if (!req.property) {
            return res.status(404).send("Property not found");
        }

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

        ])(req, res, async function(err) {

            if (err) {
                return next(err);
            }

        try {

            // Save logic will be added next.

let media = await PropertyMedia.findOne({
    property: req.params.propertyId
});

if (!media) {

    media = new PropertyMedia({
        property: req.params.propertyId,
        projectName: req.property.projectName
    });

}

if (req.files.coverPhoto) {

    media.coverPhoto = {
        filename: req.files.coverPhoto[0].filename,
        originalName: req.files.coverPhoto[0].originalname
    };

}

console.log("========== FILES RECEIVED ==========");

Object.keys(req.files).forEach(field => {
    console.log(field);

    req.files[field].forEach(file => {
        console.log("  ", file.originalname);
    });
});

console.log("====================================");

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

        });

    } catch (err) {
        next(err);
    }

});

const fs = require("fs");
const path = require("path");

router.post("/:propertyId/cover/delete", async (req, res) => {

    const media = await PropertyMedia.findOne({
        property: req.params.propertyId
    });

    if (!media || !media.coverPhoto) {
        return res.redirect("/property-media/" + req.params.propertyId);
    }

    const filePath = path.join(
        __dirname,
        "../uploads/properties/cover",
        media.coverPhoto.filename
    );

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    media.coverPhoto = undefined;

    await media.save();

    res.redirect("/property-media/" + req.params.propertyId);

});

router.post(
    "/:propertyId/cover/replace",
    async (req, res, next) => {

        req.property = await Property.findById(req.params.propertyId);

        upload.single("coverPhoto")(req, res, async function (err) {

            if (err) return next(err);

            const media = await PropertyMedia.findOne({
                property: req.params.propertyId
            });

            if (!media) {
                return res.redirect("/property-media/" + req.params.propertyId);
            }

            if (media.coverPhoto) {

                const oldFile = path.join(
                    __dirname,
                    "../uploads/properties/cover",
                    media.coverPhoto.filename
                );

                if (fs.existsSync(oldFile)) {
                    fs.unlinkSync(oldFile);
                }

            }

            if (req.file) {

                media.coverPhoto = {
                    filename: req.file.filename,
                    originalName: req.file.originalname
                };

                await media.save();

            }

            res.redirect("/property-media/" + req.params.propertyId);

        });

    }
);

router.post("/:propertyId/configuration/delete", async (req, res) => {

    const { configuration, filename } = req.body;

    const media = await PropertyMedia.findOne({
        property: req.params.propertyId
    });

    if (!media) {
        return res.redirect("/property-media/" + req.params.propertyId);
    }

    const photos = media.configurationPhotos.get(configuration) || [];

    const photo = photos.find(p => p.filename === filename);

    if (photo) {

        const filePath = path.join(
            __dirname,
            "../uploads/properties/configurations",
            filename
        );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        media.configurationPhotos.set(
            configuration,
            photos.filter(p => p.filename !== filename)
        );

        await media.save();
    }

    res.redirect("/property-media/" + req.params.propertyId);

});

router.post(
    "/:propertyId/configuration/replace",
    async (req, res, next) => {

        req.property = await Property.findById(req.params.propertyId);

        upload.any()(req, res, async function (err) {

            if (err) return next(err);

            const media = await PropertyMedia.findOne({
                property: req.params.propertyId
            });

            if (!media) {
                return res.redirect("/property-media/" + req.params.propertyId);
            }

            const configuration = req.body.configuration;
            const oldFilename = req.body.oldFilename;

            const photos = media.configurationPhotos.get(configuration) || [];

            const index = photos.findIndex(
                p => p.filename === oldFilename
            );

            if (index >= 0 && req.files.length) {

                const oldPath = path.join(
                    __dirname,
                    "../uploads/properties/configurations",
                    oldFilename
                );

                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }

                photos[index] = {
                    filename: req.files[0].filename,
                    originalName: req.files[0].originalname
                };

                media.configurationPhotos.set(configuration, photos);

                await media.save();
            }

            res.redirect("/property-media/" + req.params.propertyId);

        });

    }
);

// ================================
// DELETE AMENITY PHOTO
// ================================

router.post("/:propertyId/amenity/delete", async (req, res) => {

    const { filename } = req.body;

    const media = await PropertyMedia.findOne({
        property: req.params.propertyId
    });

    if (!media) {
        return res.redirect("/property-media/" + req.params.propertyId);
    }

    const photo = media.amenityPhotos.find(p => p.filename === filename);

    if (photo) {

        const filePath = path.join(
            __dirname,
            "../uploads/properties/amenities",
            filename
        );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        media.amenityPhotos =
            media.amenityPhotos.filter(
                p => p.filename !== filename
            );

        await media.save();
    }

    res.redirect("/property-media/" + req.params.propertyId);

});


// ================================
// REPLACE AMENITY PHOTO
// ================================

router.post(
    "/:propertyId/amenity/replace",
    async (req, res, next) => {

        req.property = await Property.findById(req.params.propertyId);

        upload.single("amenityPhoto")(req, res, async function (err) {

            if (err) return next(err);

            const media = await PropertyMedia.findOne({
                property: req.params.propertyId
            });

            if (!media) {
                return res.redirect("/property-media/" + req.params.propertyId);
            }

            const oldFilename = req.body.oldFilename;

            const index = media.amenityPhotos.findIndex(
                p => p.filename === oldFilename
            );

            if (index >= 0 && req.file) {

                const oldPath = path.join(
                    __dirname,
                    "../uploads/properties/amenities",
                    oldFilename
                );

                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }

                media.amenityPhotos[index] = {
                    filename: req.file.filename,
                    originalName: req.file.originalname
                };

                await media.save();
            }

            res.redirect("/property-media/" + req.params.propertyId);

        });

    }
);

// ================================
// DELETE USP PHOTO
// ================================

router.post("/:propertyId/usp/delete", async (req, res) => {

    const { filename } = req.body;

    const media = await PropertyMedia.findOne({
        property: req.params.propertyId
    });

    if (!media) {
        return res.redirect("/property-media/" + req.params.propertyId);
    }

    const photo = media.uspPhotos.find(p => p.filename === filename);

    if (photo) {

        const filePath = path.join(
            __dirname,
            "../uploads/properties/usp",
            filename
        );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        media.uspPhotos =
            media.uspPhotos.filter(
                p => p.filename !== filename
            );

        await media.save();
    }

    res.redirect("/property-media/" + req.params.propertyId);

});

// ================================
// REPLACE USP PHOTO
// ================================

router.post(
    "/:propertyId/usp/replace",
    async (req, res, next) => {

        req.property = await Property.findById(req.params.propertyId);

        upload.single("uspPhoto")(req, res, async function (err) {

            if (err) return next(err);

            const media = await PropertyMedia.findOne({
                property: req.params.propertyId
            });

            if (!media) {
                return res.redirect("/property-media/" + req.params.propertyId);
            }

            const oldFilename = req.body.oldFilename;

            const index = media.uspPhotos.findIndex(
                p => p.filename === oldFilename
            );

            if (index >= 0 && req.file) {

                const oldPath = path.join(
                    __dirname,
                    "../uploads/properties/usp",
                    oldFilename
                );

                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }

                media.uspPhotos[index] = {
                    filename: req.file.filename,
                    originalName: req.file.originalname
                };

                await media.save();
            }

            res.redirect("/property-media/" + req.params.propertyId);

        });

    }
);

// ================================
// DELETE PROPERTY VIDEO
// ================================

router.post("/:propertyId/video/delete", async (req, res) => {

    const media = await PropertyMedia.findOne({
        property: req.params.propertyId
    });

    if (!media || !media.propertyVideo) {
        return res.redirect("/property-media/" + req.params.propertyId);
    }

    const filePath = path.join(
        __dirname,
        "../uploads/properties/videos",
        media.propertyVideo.filename
    );

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    media.propertyVideo = undefined;

    await media.save();

    res.redirect("/property-media/" + req.params.propertyId);

});

// ================================
// REPLACE PROPERTY VIDEO
// ================================

router.post(
    "/:propertyId/video/replace",
    async (req, res, next) => {

        req.property = await Property.findById(req.params.propertyId);

        upload.single("propertyVideo")(req, res, async function (err) {

            if (err) return next(err);

            const media = await PropertyMedia.findOne({
                property: req.params.propertyId
            });

            if (!media) {
                return res.redirect("/property-media/" + req.params.propertyId);
            }

            if (media.propertyVideo) {

                const oldPath = path.join(
                    __dirname,
                    "../uploads/properties/videos",
                    media.propertyVideo.filename
                );

                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            if (req.file) {

                media.propertyVideo = {
                    filename: req.file.filename,
                    originalName: req.file.originalname
                };

                await media.save();
            }

            res.redirect("/property-media/" + req.params.propertyId);

        });

    }
);

// ================================
// DELETE BUILDER DOCUMENT
// ================================

router.post("/:propertyId/document/delete", async (req, res) => {

    const { filename } = req.body;

    const media = await PropertyMedia.findOne({
        property: req.params.propertyId
    });

    if (!media) {
        return res.redirect("/property-media/" + req.params.propertyId);
    }

    const doc = media.builderDocuments.find(
        d => d.filename === filename
    );

    if (doc) {

        const filePath = path.join(
            __dirname,
            "../uploads/properties/documents",
            filename
        );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        media.builderDocuments =
            media.builderDocuments.filter(
                d => d.filename !== filename
            );

        await media.save();
    }

    res.redirect("/property-media/" + req.params.propertyId);

});

// ================================
// REPLACE BUILDER DOCUMENT
// ================================

router.post(
    "/:propertyId/document/replace",
    async (req, res, next) => {

        req.property = await Property.findById(req.params.propertyId);

        upload.single("builderDocument")(req, res, async function (err) {

            if (err) return next(err);

            const media = await PropertyMedia.findOne({
                property: req.params.propertyId
            });

            if (!media) {
                return res.redirect("/property-media/" + req.params.propertyId);
            }

            const oldFilename = req.body.oldFilename;

            const index = media.builderDocuments.findIndex(
                d => d.filename === oldFilename
            );

            if (index >= 0 && req.file) {

                const oldPath = path.join(
                    __dirname,
                    "../uploads/properties/documents",
                    oldFilename
                );

                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }

                media.builderDocuments[index] = {
                    filename: req.file.filename,
                    originalName: req.file.originalname
                };

                await media.save();
            }

            res.redirect("/property-media/" + req.params.propertyId);

        });

    }
);

module.exports = router;