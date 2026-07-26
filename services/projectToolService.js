const OpenAI = require("openai");
const propertySearchService = require("./propertySearchService");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

exports.execute = async (tenant, message) => {

    const extraction = await client.chat.completions.create({

        model: "gpt-4.1-mini",

        response_format: {
            type: "json_object"
        },

        messages: [
            {
                role: "system",
                content: `
Extract property search filters.

Return JSON only.

{
    "city":"",
    "location":"",
    "type":"",
    "maxPrice":null
}
`
            },
            {
                role: "user",
                content: message
            }
        ]

    });

    const filters = JSON.parse(
        extraction.choices[0].message.content
    );

    const properties =
        await propertySearchService.search(
            tenant._id,
            filters
        );

if (!properties.length) {

    const propertyRecommendationService =
        require("./propertyRecommendationService");

    const recommendations =
        await propertyRecommendationService.recommend(
            tenant._id
        );

    if (!recommendations.length) {

        return {
            handled: true,
            response: "No properties are currently available."
        };

    }

    let answer =
        "No exact match found.\n\nRecommended Properties\n\n";

    recommendations.forEach((p, index) => {

        answer +=
`${index + 1}. ${p.propertyName}
Price: ${p.price}
Location: ${p.location}

`;

    });

    return {
        handled: true,
        response: answer;

}

    let answer = "Matching Properties\n\n";

    properties.forEach((p, index) => {

        answer +=
`${index + 1}. ${p.propertyName}
Price: ${p.price}
Location: ${p.location}

`;

    });

return {
    handled: true,
    response: answer
};

};