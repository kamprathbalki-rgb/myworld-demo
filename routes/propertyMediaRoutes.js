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

upload.any()(req, res, async function (err) {

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

const coverPhoto = req.files.find(
    file => file.fieldname === "coverPhoto"
);

if (coverPhoto) {

    media.coverPhoto = {
        filename: coverPhoto.filename,
        originalName: coverPhoto.originalname
    };

}

req.files.forEach(file => {
    console.log(file.fieldname);
    console.log("  ", file.originalname);
});

req.files.forEach(file => {

    if (!file.fieldname.startsWith("configuration_")) return;

    const parts = file.fieldname.replace("configuration_", "").split("_");

    const configuration = parts[0];
    const room = parts.slice(1).join("_");

    let rooms = media.configurationPhotos.get(configuration);

    if (!rooms) {
        rooms = new Map();
    }

    rooms.set(room, {
        filename: file.filename,
        originalName: file.originalname,
        relativePath:
            `${req.property.projectName}-${req.property._id}/` +
            `${configuration.replace(/\s+/g, "-")}/` +
            `${room.replace(/\s+/g, "-")}/` +
            file.filename
    });

    media.configurationPhotos.set(configuration, rooms);
});

const amenityPhotos = req.files.filter(
    file => file.fieldname === "amenityPhotos"
);

if (amenityPhotos.length) {

    media.amenityPhotos = amenityPhotos.map(file => ({
        filename: file.filename,
        originalName: file.originalname
    }));

}

const uspPhotos = req.files.filter(
    file => file.fieldname === "uspPhotos"
);

if (uspPhotos.length) {

    media.uspPhotos = uspPhotos.map(file => ({
        filename: file.filename,
        originalName: file.originalname
    }));

}

const propertyVideo = req.files.find(
    file => file.fieldname === "propertyVideo"
);

if (propertyVideo) {

    media.propertyVideo = {
        filename: propertyVideo.filename,
        originalName: propertyVideo.originalname
    };

}

const builderDocuments = req.files.filter(
    file => file.fieldname === "builderDocuments"
);

if (builderDocuments.length) {

    media.builderDocuments = builderDocuments.map(file => ({
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

const { configuration, room, filename } = req.body;

const media = await PropertyMedia.findOne({
    property: req.params.propertyId
});

if (!media) {
    return res.redirect("/property-media/" + req.params.propertyId);
}

const rooms = media.configurationPhotos.get(configuration);

if (!rooms) {
    return res.redirect("/property-media/" + req.params.propertyId);
}

const photo = rooms.get(room);

if (!photo) {
    return res.redirect("/property-media/" + req.params.propertyId);
}

const filePath = path.join(
    __dirname,
    "../public/uploads/properties",
    photo.relativePath
);

if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
}

rooms.delete(room);

media.configurationPhotos.set(configuration, rooms);

await media.save();

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
const room = req.body.room;
const oldFilename = req.body.oldFilename;

const rooms = media.configurationPhotos.get(configuration);

if (!rooms) {
    return res.redirect("/property-media/" + req.params.propertyId);
}

const existing = rooms.get(room);

if (!existing) {
    return res.redirect("/property-media/" + req.params.propertyId);
}

const fieldName = `configuration_${configuration}_${room}`;
const file = req.files.find(f => f.fieldname === fieldName);

if (file) {

    const oldPath = path.join(
        __dirname,
        "../public/uploads/properties",
        existing.relativePath
    );

    if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
    }

    rooms.set(room, {
        filename: file.filename,
        originalName: file.originalname,
        relativePath:
            `${req.property.projectName}-${req.property._id}/` +
            `${configuration.replace(/\s+/g, "-")}/` +
            `${room.replace(/\s+/g, "-")}/` +
            file.filename
    });

    media.configurationPhotos.set(configuration, rooms);

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