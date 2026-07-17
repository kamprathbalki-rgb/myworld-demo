const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const fs = require('fs');
const path = require('path');
let activeRequests = 0;

const {
    getLearningExamples
} = require('./learningService');

console.log(
    'PROMPT FILE:',
    path.join(
        process.cwd(),
        'Prompts',
        `whatsappExtractionPrompt.${process.env.PROMPT_VERSION}.txt`
    )
);

function getISTTime() {
    return new Date().toLocaleTimeString(
        'en-IN',
        {
            timeZone: 'Asia/Kolkata',
            hour12: true
        }
    )
}

function getISTDate() {
    return new Date().toLocaleDateString(
        'en-CA',
        {
            timeZone: 'Asia/Kolkata'
        }
    )
}

function loadPrompt() {

    const promptFile =
    path.join(
        process.cwd(),
        'Prompts',
        `whatsappExtractionPrompt.${process.env.PROMPT_VERSION}.txt`
    );

    return fs.readFileSync(
        promptFile,
        'utf8'
    );

}

async function extractWithAI(
    message
) {

    try {

const systemPrompt =
loadPrompt();

const learningExamples =
await getLearningExamples();

console.log(
    'AI MODEL:',
    process.env.OPENAI_MODEL
);

        const response =
        await openai.chat.completions.create({

            model: process.env.OPENAI_MODEL,

            messages: [

{
    role: 'system',
    content:
        systemPrompt +
        '\n\nLEARNING EXAMPLES:\n' +
        JSON.stringify(
            learningExamples,
            null,
            2
        )
},

{
    role: 'user',
    content: `
Message:
${message}
`
}

            ],

        });

console.log(
    'AI REQUEST SUCCESS'
);

activeRequests++;

console.log(
    'REQUEST COMPLETE:',
    process.pid,
    new Date().toISOString()
);

const content =
response.choices[0].message.content;

console.log(
    'AI TOKENS:',
    response.usage
);

const result =
JSON.parse(content);

result.aiUsage =
response.usage;

return result;

} catch (err) {

    console.log(
        'AI EXTRACTION ERROR:',
        err.status,
        err.message
    );

    console.log(
        'AI ERROR:',
        JSON.stringify(
            err,
            null,
            2
        )
    );

    try {

        const errorLog =
`
==================================================
TIME: ${new Date().toISOString()}

MODEL: ${process.env.OPENAI_MODEL}

MESSAGE:
${message}

ERROR STATUS:
${err.status}

ERROR MESSAGE:
${err.message}

ERROR DETAILS:
${JSON.stringify(err, null, 2)}

==================================================

`;

        fs.appendFileSync(
            path.join(
                process.cwd(),
                'ai-error-log.txt'
            ),
            errorLog
        );

    } catch (logErr) {

        console.log(
            'ERROR LOG WRITE FAILED:',
            logErr.message
        );

    }

    return {
        error: err.message
    };

}

}

module.exports = {
    extractWithAI
};