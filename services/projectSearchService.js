const Project = require("../models/Project");

exports.search = async (tenantId, filters = {}) => {

    const query = {
        tenantId,
        active: true
    };

    if (filters.city)
        query.city = new RegExp(filters.city, "i");

    if (filters.location)
        query.location = new RegExp(filters.location, "i");

    if (filters.builder)
        query.builder = new RegExp(filters.builder, "i");

    const projects = await Project
        .find(query)
        .limit(10)
        .lean();

    return projects;

};