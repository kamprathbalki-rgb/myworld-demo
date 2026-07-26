const TenantKnowledge = require("../models/TenantKnowledge");

exports.getKnowledge = async (tenantId) => {

    const knowledge = await TenantKnowledge.find({
        tenantId,
        active: true
    })
    .select("category title content")
    .lean();

    if (!knowledge.length) {
        return "";
    }

    return knowledge.map(item => `
Category: ${item.category}
Title: ${item.title}
Content:
${item.content}
`).join("\n\n--------------------------------\n\n");

};