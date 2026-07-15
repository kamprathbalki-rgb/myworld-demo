const express =
require('express');

const router =
express.Router();

const LearningCorrection =
require('../models/LearningCorrection');

const WhatsappMessage =
require('../models/WhatsappMessage');

router.post(
    '/add',
    async (req, res) => {

        try {

const correction =
await LearningCorrection.create({

    originalMessage:
    req.body.originalMessage,

    aiOutput:
    JSON.parse(
        req.body.aiOutput
    ),

    correctedOutput:
    JSON.parse(
        req.body.correctedOutput
    )

});

res.redirect(
    '/learning-correction/list'
);

        } catch (err) {

            res.status(500).json({
                success: false,
                error: err.message
            });

        }

    }
);

router.get(
    '/list',
    async (req, res) => {

        const corrections =
        await LearningCorrection
        .find()
        .sort({ createdAt: -1 })
        .limit(500);

        res.render(
            'learningCorrections',
            {
                corrections
            }
        );

    }
);

router.get(
    '/create/:messageId',
    async (req, res) => {

        const message =
        await WhatsappMessage.findById(
            req.params.messageId
        );

        res.render(
            'learningCorrectionCreate',
            {
                message
            }
        );

    }
);

router.get(
    '/edit/:id',
    async (req, res) => {

        const correction =
        await LearningCorrection.findById(
            req.params.id
        );

        res.render(
            'learningCorrectionEdit',
            {
                correction
            }
        );

    }
);

router.post(
    '/edit/:id',
    async (req, res) => {

        await LearningCorrection.updateOne(

            {
                _id:
                req.params.id
            },

            {
                $set: {

                    originalMessage:
                    req.body.originalMessage,

                    aiOutput:
                    JSON.parse(
                        req.body.aiOutput
                    ),

                    correctedOutput:
                    JSON.parse(
                        req.body.correctedOutput
                    )

                }
            }

        );

        res.redirect(
            '/learning-correction/list'
        );

    }
);

module.exports = router;