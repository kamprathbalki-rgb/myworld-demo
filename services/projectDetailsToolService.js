const Project = require("../models/Project");

exports.execute = async (tenant, message) => {

    const project = await Project.findOne({
        tenantId: tenant._id,
        projectName: new RegExp(message, "i")
    }).lean();

    if (!project) {
        return {
            handled: false,
            response: null
        };
    }

    return {
        handled: true,
        response: `
Project: ${project.projectName}

Builder: ${project.builder || ""}

Location: ${project.location || ""}

Description:
${project.description || ""}

Starting Price:
${project.startingPrice || ""}

Status:
${project.status || ""}
`
    };

};