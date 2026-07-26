const ChatLead = require("../models/ChatLead");

exports.markEmailVerified = async (
    tenantId,
    sessionId,
    email
) => {

    await ChatLead.findOneAndUpdate(
        {
            tenantId,
            sessionId,
            email
        },
        {
            emailVerified: true
        }
    );

};

exports.markMobileVerified = async (
    tenantId,
    sessionId,
    mobile
) => {

    await ChatLead.findOneAndUpdate(
        {
            tenantId,
            sessionId,
            mobile
        },
        {
            mobileVerified: true
        }
    );

};

exports.save = async (
    tenantId,
    sessionId,
    lead
) => {

    if (!lead) {
        return;
    }

    const existing = await ChatLead.findOne({
        tenantId,
        sessionId
    });

    if (existing) {

const fields = [
    "name",
    "mobile",
    "email",
    "propertyCategory",
    "purpose",
    "location",
    "propertyType",
    "configuration",
    "budget",
    "timeline",
    "verificationRequestedAt",
    "emailVerified",
    "mobileVerified",
    "mobileDeclined",
    "emailDeclined"
];

        for (const field of fields) {
for (const field of fields) {
    if (
        lead[field] !== undefined &&
        (
            lead[field] === null ||
            lead[field] !== ""
        )
    ) {
        existing[field] = lead[field];
    }
}
        }

        await existing.save();
        return existing;
    }

    return await ChatLead.create({

        tenantId,

        sessionId,

        name: lead.name,

        mobile: lead.mobile,

        email: lead.email,

        propertyCategory: lead.propertyCategory,

        purpose: lead.purpose,

        location: lead.location,

        propertyType: lead.propertyType,

        configuration: lead.configuration,

        budget: lead.budget,

        timeline: lead.timeline,

        guestMode: !lead.name

    });

};

exports.get = async (
    tenantId,
    sessionId
) => {

    return await ChatLead.findOne({
        tenantId,
        sessionId
    });

};