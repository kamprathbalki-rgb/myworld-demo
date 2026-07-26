const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

exports.extract = async (message) => {

    const response = await client.chat.completions.create({

        model: "gpt-4.1-mini",

        response_format: {
            type: "json_object"
        },

        messages: [
            {
                role: "system",
                content: `
You are an information extraction engine.

Extract ONLY information explicitly mentioned by the user.

Return ONLY valid JSON.

{
    "name": "",
    "mobile": "",
    "email": "",
    "propertyCategory": "",
    "purpose": "",
    "location": "",
    "propertyType": "",
    "configuration": "",
    "budget": "",
    "timeline": "",

    "mobileIntent": "",
    "emailIntent": ""
}

Rules

- Never invent information.
- Never guess personal information.
- Return empty string ("") for fields not mentioned.
- Return ONLY valid JSON.

Corrections

- If the user corrects an earlier value, return the corrected value.
- If the user rejects a previous value without giving a replacement, return null for that field.

Examples

"I'm not Raj, I'm Ravi"

{
  "name":"Ravi"
}

"I'm not from Mumbai. I'm from Pune."

{
  "location":"Pune"
}

"I am not Raj."

{
  "name":null
}

Contact Intent

For mobileIntent return one of:

"PROVIDED"
"LATER"
"DECLINED"
"UNKNOWN"

Examples

"My number is 9876543210"

mobile: "9876543210"
mobileIntent: "PROVIDED"

"I'll share later"

mobileIntent: "LATER"

"I don't want to share my number"

mobileIntent: "DECLINED"

Similarly return emailIntent using the same values.

Property Mapping

Return ONLY values that are explicitly stated.

If the user says only "Residential":

{
    "propertyCategory":"Residential"
}

Do NOT infer propertyType.

Do NOT infer configuration.

If the user says "Apartment":

{
    "propertyCategory":"Residential",
    "propertyType":"Apartment"
}

If the user says "2 BHK":

{
    "propertyCategory":"Residential",
    "configuration":"2 BHK"
}

Do NOT set propertyType unless the user explicitly says Apartment, Flat, Villa, Plot, Office, Shop, etc.

Do NOT infer Apartment from 1 BHK, 2 BHK, 3 BHK or 4 BHK.

If the user mentions

Office
Shop
Showroom
Warehouse
Industrial Shed

then ALWAYS return

"propertyCategory":"Commercial"

If the user mentions

Plot
Land
Site
Residential Plot
Commercial Plot

then ALWAYS return

"propertyCategory":"Plot"

Examples

"I need a flat"

{
  "propertyCategory":"Residential",
  "propertyType":"Flat"
}

"I need a 2BHK"

{
  "propertyCategory":"Residential",
  "propertyType":"Flat",
  "configuration":"2BHK"
}

"I need a villa"

{
  "propertyCategory":"Residential",
  "propertyType":"Villa"
}

"I need an office"

{
  "propertyCategory":"Commercial",
  "propertyType":"Office"
}

"I need a plot"

{
  "propertyCategory":"Plot",
  "propertyType":"Plot"
}

Other Rules

- Extract mobile exactly as spoken.
- Extract email exactly as spoken.
- Extract budget exactly as spoken.
- Extract timeline exactly as spoken.
- Do not overwrite fields that were not mentioned.

CRITICAL RULES

- Never infer any field from another field.
- Never populate propertyType unless those exact words were spoken.
- Never populate configuration unless it was explicitly mentioned.
- Never overwrite previously collected information.
- Return values only for information present in the current user message.
- Return ONLY JSON.
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