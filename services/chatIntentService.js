const OpenAI = require("openai");
const promptLoader = require("./promptLoader");

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
                content: promptLoader.load("intentDetection.txt")
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