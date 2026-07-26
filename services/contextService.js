const tenantService = require("./tenantService");
const knowledgeService = require("./knowledgeService");

exports.buildContext = async (tenantUrl) => {

    const tenant = await tenantService.getTenant(tenantUrl);

    const knowledge = await knowledgeService.getKnowledge(
        tenant._id
    );

    return {
        tenant,
        knowledge
    };

};