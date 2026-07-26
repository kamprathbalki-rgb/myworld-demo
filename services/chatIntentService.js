const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

exports.detect = async (message) => {

    const response = await client.chat.completions.create({

        model: "gpt-4.1-mini",

        response_format: {
            type: "json_object"
        },

        messages: [
            {
                role: "system",
                content: `
Classify the user's intent.

Return JSON only.

{
    "intent":"",
    "confidence":0
}

Possible intents:

GENERAL
FAQ
KNOWLEDGE
CHECK_AVAILABILITY
PROPERTY_SEARCH
PROPERTY_DETAILS
BOOK_SITE_VISIT
CONTACT_REQUEST
LEAD
GREETING
GOODBYE
`
            },
            {
                role: "user",
                content: message
            }
        ]
    });

    return JSON.parse(
        response.choices[0].message.content
    );

};