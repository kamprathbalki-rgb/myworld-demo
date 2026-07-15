const KeywordMaster =
require('../models/KeywordMaster');

async function extractIntent(
    message
) {

    const text =
    message.toLowerCase();

    try {

        const keywords =
        await KeywordMaster.find({
            active: true
        });

        for (
            const keyword of keywords
        ) {

            if (
                text.includes(
                    keyword.keyword.toLowerCase()
                )
            ) {

                return keyword.type;

            }

        }

    } catch (err) {

        console.log(
            'Keyword lookup skipped'
        );

    }

    if (
        text.includes('need') ||
        text.includes('required') ||
        text.includes('requirement') ||
        text.includes('looking') ||
        text.includes('wanted')
    ) {

        return 'REQUIREMENT';

    }

    if (
        text.includes('for sale') ||
        text.includes('for rent') ||
        text.includes('available') ||
        text.includes('lease')
    ) {

        return 'INVENTORY';

    }

    return 'OTHER';

}

function extractBHK(
    message
) {

    const patterns = [

        /(\d+)\s*bhk/i,

        /(\d+)\s*bedroom/i,

        /(\d+)\s*bed/i

    ];

    for (
        const pattern of patterns
    ) {

        const match =
        message.match(
            pattern
        );

        if (match) {

            return parseInt(
                match[1]
            );

        }

    }

    if (
        /one\s*bhk/i.test(
            message
        )
    ) return 1;

    if (
        /two\s*bhk/i.test(
            message
        )
    ) return 2;

    if (
        /three\s*bhk/i.test(
            message
        )
    ) return 3;

    if (
        /four\s*bhk/i.test(
            message
        )
    ) return 4;

    if (
        /five\s*bhk/i.test(
            message
        )
    ) return 5;

    return null;

}

function extractPhoneNumbers(
    message
) {

    const matches =
    message.match(
        /(?:\+91|91)?[6-9]\d{9}/g
    );

    if (!matches) {

        return [];

    }

    return [
        ...new Set(matches)
    ];

}

function extractArea(
    message
) {

    const patterns = [

        /(\d+)\s*sq\s*ft/i,

        /(\d+)\s*sqft/i,

        /(\d+)\s*sq\.ft/i,

        /area\s*[:-]?\s*(\d+)/i

    ];

    for (
        const pattern of patterns
    ) {

        const match =
        message.match(
            pattern
        );

        if (match) {

            return parseInt(
                match[1]
            );

        }

    }

    return null;

}

function extractBudget(
    message
) {

    const text =
    message.toLowerCase();

    let match =
    text.match(
        /rent\s*[-:]?\s*(\d+)/i
    );

    if (match) {

        return parseInt(
            match[1]
        );

    }

    match =
    text.match(
        /(\d+(?:\.\d+)?)\s*(cr|crore)/i
    );

    if (match) {

        return Math.round(
            parseFloat(
                match[1]
            ) * 10000000
        );

    }

    match =
    text.match(
        /(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs)\b/i
    );

    if (match) {

        return Math.round(
            parseFloat(
                match[1]
            ) * 100000
        );

    }

    return null;

}

function extractTransactionType(
    message
) {

    const text =
    message.toLowerCase();

    if (

        text.includes(
            'for rent'
        ) ||

        text.includes(
            'rent'
        ) ||

        text.includes(
            'rental'
        ) ||

        text.includes(
            'lease'
        )

    ) {

        return 'RENT';

    }

    if (

        text.includes(
            'for sale'
        ) ||

        text.includes(
            'sale'
        ) ||

        text.includes(
            'sell'
        )

    ) {

        return 'SALE';

    }

    return null;

}

async function extractMessage(
    message
) {

    return {

        intent:
        await extractIntent(
            message
        ),

        bhk:
        extractBHK(
            message
        ),

        phones:
        extractPhoneNumbers(
            message
        ),

        area:
        extractArea(
            message
        ),

        budget:
        extractBudget(
            message
        ),

        transactionType:
        extractTransactionType(
            message
        )

    };

}

module.exports = {

    extractMessage,

    extractIntent,

    extractBHK,

    extractPhoneNumbers,

    extractArea,

    extractBudget,

    extractTransactionType

};