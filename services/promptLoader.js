const fs = require("fs");
const path = require("path");

exports.load = (fileName, variables = {}) => {

    let prompt = fs.readFileSync(
        path.join(__dirname, "../prompts", fileName),
        "utf8"
    );

    Object.entries(variables).forEach(([key, value]) => {

        prompt = prompt.replaceAll(
            `{{${key}}}`,
            value ?? ""
        );

    });

    return prompt;

};