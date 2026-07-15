const express = require('express');
const router = express.Router();

const KeywordMaster =
require('../models/KeywordMaster');

const {
    isLoggedIn,
    isSaasAdmin
} = require(
    '../middleware/auth'
);

const { extractMessage } = require('../services/whatsappExtractor');

const WhatsappMessage =
require('../models/WhatsappMessage');

router.get(
'/list',
isSaasAdmin,
async (req, res) => {

const keywords =
await KeywordMaster
.find()
.sort({
    type:1,
    keyword:1
});

res.render(
    'keywordList',
    {
        keywords
    }
);

});


router.get(
'/test-extractor',
isSaasAdmin,
async (req, res) => {

const messages =
await WhatsappMessage
.find()
.sort({
    createdAt:-1
})
.limit(20);

const results = [];

for (
const msg of messages
) {

results.push({

message:
msg.message,

extracted:
await extractMessage(
    msg.message
)

});

}

res.render(
'testExtractor',
{
    results
}
);

});

router.get(
'/add',
isSaasAdmin,
(req, res) => {

res.render(
    'addKeyword'
);

});

router.post(
'/save',
isSaasAdmin,
async (req, res) => {

await KeywordMaster.create({

    keyword:
    req.body.keyword
    .trim()
    .toLowerCase(),

    type:
    req.body.type,

    active: true

});

res.redirect(
    '/keyword/list'
);

});

router.get(
'/toggle/:id',
isSaasAdmin,
async (req, res) => {

const keyword =
await KeywordMaster.findById(
    req.params.id
);

keyword.active =
!keyword.active;

await keyword.save();

res.redirect(
    '/keyword/list'
);

});

router.get(
'/edit/:id',
isSaasAdmin,
async (req, res) => {

const keyword =
await KeywordMaster.findById(
    req.params.id
);

res.render(
    'editKeyword',
    {
        keyword
    }
);

});


router.post(
'/update/:id',
isSaasAdmin,
async (req, res) => {

await KeywordMaster.findByIdAndUpdate(

req.params.id,

{
    keyword:
    req.body.keyword
    .trim()
    .toLowerCase(),

    type:
    req.body.type
}

);

res.redirect(
    '/keyword/list'
);

});

router.get(
'/other-messages',
isSaasAdmin,
async (req, res) => {

const messages =
await WhatsappMessage
.find({
    classification: 'OTHER'
})
.sort({
    createdAt:-1
})
.limit(100);

res.render(
    'otherMessages',
    {
        messages
    }
);

});

module.exports = router;