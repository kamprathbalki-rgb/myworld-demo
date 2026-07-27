const contextService = require("./contextService");
const promptLoader = require("./promptLoader");

exports.getSystemPrompt = async (tenantUrl) => {

    const { tenant, knowledge } =
        await contextService.buildContext(tenantUrl);

    return promptLoader.load("systemPrompt.txt",
    {
        aiRole: tenant.aiRole || "",
        companyName: tenant.name || "",
        businessDescription: tenant.businessDescription || tenant.description || "",
        address: tenant.address || "",
        phone: tenant.phone || "",
        email: tenant.email || "",
        website: tenant.website || "",
        instructions: tenant.aiInstructions || "",
        knowledge: knowledge || ""
    }
);
};