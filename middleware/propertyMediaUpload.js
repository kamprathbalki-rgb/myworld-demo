const multer = require("multer");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "../public/uploads/properties");

function safeName(name = "") {
    return name
        .trim()
        .replace(/[<>:"/\\|?*]/g, "")
        .replace(/\s+/g, "-");
}

const storage = multer.diskStorage({

    destination(req, file, cb) {

        const property = req.property;

        if (!property) {
            return cb(new Error("Property not loaded before upload."));
        }

const projectFolder =
    safeName(property.projectName) + "-" + property._id;

        let destination = path.join(ROOT, projectFolder);

        switch (file.fieldname) {

            case "coverPhoto":
                destination = path.join(destination, "cover");
                break;

case "amenityPhotos":
case "amenityPhoto":
    destination = path.join(destination, "amenities");
    break;

case "uspPhotos":
case "uspPhoto":
    destination = path.join(destination, "usp");
    break;

case "builderDocuments":
case "builderDocument":
    destination = path.join(destination, "documents");
    break;

            default:

                if (file.fieldname.startsWith("configuration_")) {

                    let config =
                        file.fieldname.replace("configuration_", "");

                    // Future support:
                    // configuration_1-BHK_Living-Room
                    // configuration_2-BHK_Kitchen

                    if (config.includes("_")) {

                        const parts = config.split("_");

destination = path.join(
    destination,
    safeName(parts[0]),
    safeName(parts.slice(1).join("_"))
);

                    } else {

                        destination = path.join(
                            destination,
                            safeName(config)
                        );

                    }

                } else {

                    return cb(new Error("Unknown upload field."));

                }

        }

        fs.mkdirSync(destination, { recursive: true });

        cb(null, destination);

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

module.exports = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024
    }
});