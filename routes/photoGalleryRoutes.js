const express = require('express');
const router = express.Router();

const { isLoggedIn, isAdmin } = require('../middleware/auth');

const Property = require('../models/Property');
const PropertyMedia = require('../models/PropertyMedia');
const Buyer = require('../models/Buyer');
const mediaLimits = require('../data/propertyMediaLimits');
const { sendEmail } = require('../utils/emailService');
const emailTemplates = require('../data/emailTemplates');

// ==========================================
// PHOTO GALLERY
// ==========================================

router.get(
    '/',
    isLoggedIn,
    isAdmin,
    async (req, res) => {

        try {

            const properties = await Property.find({
                tenantId: req.session.tenantId
            })
            .sort({ projectName: 1 })

const buyers = await Buyer.find({
    tenantId: req.session.tenantId
})
.select("name phone email status")
.sort({ name: 1 });

            const gallery = []

            for (const property of properties) {

                const media = await PropertyMedia.findOne({
                    property: property._id
                })

                let cover = 0
                let configurationUploaded = 0
                let configurationRequired = 0
                let amenity = 0
                let usp = 0
                let video = 0
                let documents = 0

                if (media && media.coverPhoto) {
                    cover = 1
                }

                if (property.configurations) {

                    property.configurations.forEach(config => {

                        const configuration =
                            config.flatType

                        const placeholders =
                            mediaLimits.configurationPhotos[
                                configuration
                            ] || []

                        configurationRequired +=
                            placeholders.length

                        const uploadedRooms =
                            media &&
                            media.configurationPhotos
                                ? media.configurationPhotos.get(configuration)
                                : null

                        placeholders.forEach(room => {

                            if (
                                uploadedRooms &&
                                uploadedRooms.get(room)
                            ) {
                                configurationUploaded++
                            }

                        })

                    })

                }

                amenity =
                    media?.amenityPhotos?.length || 0

                usp =
                    media?.uspPhotos?.length || 0

                video =
                    media?.propertyVideo ? 1 : 0

                documents =
                    media?.builderDocuments?.length || 0

                const totalUploaded =
                    cover +
                    configurationUploaded +
                    amenity +
                    usp +
                    video +
                    documents

                const totalRequired =
                    1 +
                    configurationRequired +
                    mediaLimits.amenityPhotos.maxFiles +
                    mediaLimits.uspPhotos.maxFiles +
                    1

                const completion =
                    totalRequired
                        ? Math.round(
                            (totalUploaded * 100) /
                            totalRequired
                        )
                        : 0

                gallery.push({

                    project: property,

                    cover,

                    configurationUploaded,

                    configurationRequired,

                    amenity,

                    usp,

                    video,

                    documents,

                    totalUploaded,

                    totalRequired,

                    completion

                })

            }

            res.render(
                'photoGallery',
                {
                    gallery,
                    buyers
                }
            )

        } catch (err) {

            console.error(err)

            res.status(500).send(
                'Unable to load Photo Gallery'
            )

        }

    }
)

router.post('/send', async (req, res) => {

    try {

        console.log('==============================');
        console.log('PHOTO GALLERY SEND REQUEST');
        console.log('Tenant :', req.session.tenantId);
        console.log('Body   :', JSON.stringify(req.body, null, 2));
        console.log('==============================');

        res.json({
            success: true,
            message: 'Request received'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

router.post('/send-email', async (req, res) => {

    try {

        const buyer = await Buyer.findOne({
            _id: req.body.buyerId,
            tenantId: req.session.tenantId
        });

        if (!buyer) {
            return res.status(404).json({
                success: false,
                message: 'Buyer not found'
            });
        }

        if (!buyer.email) {
            return res.status(400).json({
                success: false,
                message: 'Buyer has no email address'
            });
        }

        const projects = await Property.find({
            _id: { $in: req.body.propertyIds },
            tenantId: req.session.tenantId
        });

const gallery = await PropertyMedia.find({
    property: { $in: req.body.propertyIds },
    tenantId: req.session.tenantId
});

        let projectHtml = '';

projects.forEach(project => {

    const media = gallery.find(g =>
        g.property.toString() === project._id.toString()
    );

    projectHtml += `<div style="margin-bottom:30px;">`;
    projectHtml += `<h3>${project.projectName}</h3>`;

    if (media) {

        if (req.body.include.cover && `${baseUrl}/uploads/properties/${media.coverPhoto.relativePath}`) {
            projectHtml += `
                <p>
                    <b>Cover Photo:</b><br>
                    <a href="${media.coverPhoto}" target="_blank">
                        View Cover Photo
                    </a>
                </p>`;
        }

if (
    req.body.include.configurations &&
    media.configurationPhotos &&
    media.configurationPhotos.size
) {

    projectHtml += `<p><b>Configuration Photos</b></p><ul>`;

    for (const [configuration, rooms] of media.configurationPhotos) {

        for (const [room, photo] of rooms) {

            projectHtml += `
                <li>
                    ${configuration} - ${room}<br>
                    <a href="${baseUrl}/uploads/properties/${photo.relativePath}" target="_blank">
                        View Photo
                    </a>
                </li>
            `;
        }
    }

    projectHtml += `</ul>`;
}

        if (req.body.include.amenities && media.amenityPhotos.length) {

            projectHtml += `<p><b>Amenities</b></p><ul>`;

            media.amenityPhotos.forEach(photo => {
                projectHtml += `<li><a href="${baseUrl}/uploads/properties/${photo.relativePath}" target="_blank">View Photo</a></li>`;
            });

            projectHtml += `</ul>`;
        }

        if (req.body.include.usp && media.uspPhotos.length) {

            projectHtml += `<p><b>USP Photos</b></p><ul>`;

            media.uspPhotos.forEach(photo => {
                projectHtml += `<li><a href="${baseUrl}/uploads/properties/${photo.relativePath}" target="_blank">View Photo</a></li>`;
            });

            projectHtml += `</ul>`;
        }

        if (req.body.include.video && media.propertyVideo) {
            projectHtml += `
                <p>
                    <b>Video:</b><br>
                    <a href="${baseUrl}/uploads/properties/${media.propertyVideo.relativePath}" target="_blank">
                        Watch Video
                    </a>
                </p>`;
        }

        if (req.body.include.documents && media.builderDocuments.length) {

            projectHtml += `<p><b>Documents</b></p><ul>`;

            media.builderDocuments.forEach(doc => {
                projectHtml += `<li><a href="${baseUrl}/uploads/properties/${doc.relativePath}" target="_blank">Download Document</a></li>`;
            });

            projectHtml += `</ul>`;
        }

    }

    projectHtml += `</div>`;

});

        let html = emailTemplates.propertyShare({
            buyerName: buyer.name,
            companyName: req.session.companyName || 'MyWorld CRM'
        });

        html = html.replace('{{PROJECT_LIST}}', projectHtml);

        await sendEmail(
            buyer.email,
            'Property Information',
            html
        );

        res.json({
            success: true,
            message: `Email sent to ${buyer.email}`
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

module.exports = router;