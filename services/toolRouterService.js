const siteVisitToolService = require("./siteVisitToolService");
const contactToolService = require("./contactToolService");
const faqToolService = require("./faqToolService");
const knowledgeToolService = require("./knowledgeToolService");
const availabilityToolService = require("./availabilityToolService");
const greetingToolService = require("./greetingToolService");
const goodbyeToolService = require("./goodbyeToolService");

exports.execute = async (tenant, intent, message, sessionId) => {

    switch (intent.intent) {

        case "PROPERTY_SEARCH":
            return await propertyToolService.execute(
                tenant,
                message
            );

case "BOOK_SITE_VISIT":
    return await siteVisitToolService.execute(
        tenant,
        message,
        sessionId
    );

        case "CONTACT_REQUEST":
            return await contactToolService.execute(
                tenant,
                message
            );

        case "FAQ":
    return await faqToolService.execute(
        tenant,
        message
    );

case "KNOWLEDGE":
    return await knowledgeToolService.execute(
        tenant,
        message
    );

case "CHECK_AVAILABILITY":
    return await availabilityToolService.execute(
        tenant,
        message
    );

case "GREETING":
    return await greetingToolService.execute(
        tenant
    );

case "GOODBYE":
    return await goodbyeToolService.execute();

        default:
            return {
                handled: false,
                response: null
            };
    }

};