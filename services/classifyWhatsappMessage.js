const KeywordMaster =
require('../models/KeywordMaster');

async function classifyWhatsappMessage(message) {

    const text =
    (message || '').toLowerCase();

    const keywords =
    await KeywordMaster.find({
        active: true
    });

    for (const item of keywords) {

        if (
            text.includes(
                item.keyword.toLowerCase()
            )
        ) {
            return item.type;
        }

    }

    return 'OTHER';

}

module.exports =
classifyWhatsappMessage;