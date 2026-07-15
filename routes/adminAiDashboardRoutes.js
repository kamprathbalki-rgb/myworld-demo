const express =
require('express');

const router =
express.Router();

const WhatsappMessage =
require('../models/WhatsappMessage');

router.get(
'/admin/ai-dashboard',
async (req, res) => {

const result =
await WhatsappMessage.aggregate([

{
    $match: {
        "aiUsage.total_tokens": {
            $exists: true
        }
    }
},

{
    $group: {

        _id: null,

        totalRequests: {
            $sum: 1
        },

        promptTokens: {
            $sum:
            '$aiUsage.prompt_tokens'
        },

        completionTokens: {
            $sum:
            '$aiUsage.completion_tokens'
        },

        totalTokens: {
            $sum:
            '$aiUsage.total_tokens'
        }

    }

}

]);

res.json(
result[0] || {}
);

}
);


router.get(
'/admin/ai-dashboard/tenant',
async (req, res) => {

const result =
await WhatsappMessage.aggregate([

{
    $group: {

        _id:
        '$tenantId',

        requests: {
            $sum: 1
        },

        tokens: {
            $sum:
            '$aiUsage.total_tokens'
        }

    }

}

]);

res.json(
result
);

}
);

module.exports =
router;