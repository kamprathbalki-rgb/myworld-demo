const multer = require("multer");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "../public/uploads/properties");

const folders = {
    cover: path.join(ROOT, "cover"),
    configurations: path.join(ROOT, "configurations"),
    amenities: path.join(ROOT, "amenities"),
    usp: path.join(ROOT, "usp"),
    videos: path.join(ROOT, "videos"),
    documents: path.join(ROOT, "documents")
};

Object.values(folders).forEach(folder => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
});

const storage = multer.diskStorage({

    destination(req, file, cb) {

        switch (file.fieldname) {

            case "coverPhoto":
                return cb(null, folders.cover);

            case "propertyVideo":
                return cb(null, folders.videos);

            case "builderDocuments":
                return cb(null, folders.documents);

            default:

                if (file.fieldname.startsWith("configuration_")) {
                    return cb(null, folders.configurations);
                }

                if (file.fieldname === "amenityPhotos") {
                    return cb(null, folders.amenities);
                }

                if (file.fieldname === "uspPhotos") {
                    return cb(null, folders.usp);
                }

                return cb(new Error("Unknown upload field."));
        }
    },

    filename(req, file, cb) {

        const ext = path.extname(file.originalname);

        cb(
            null,
            Date.now() +
            "-" +
            Math.random().toString(36).substring(2, 8) +
            ext
        );
    }
});

const fileFilter = (req, file, cb) => {

    if (file.fieldname === "propertyVideo") {

        const allowed = [
            "video/mp4",
            "video/quicktime",
            "video/x-msvideo"
        ];

        return cb(null, allowed.includes(file.mimetype));
    }

    if (file.fieldname === "builderDocuments") {

        return cb(null, file.mimetype === "application/pdf");
    }

    return cb(null, file.mimetype.startsWith("image/"));
};

module.exports = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 100 * 1024 * 1024 // default 5 MB
    }

});