const Visit = require("../models/Visit");

exports.execute = async (tenant, message, sessionId) => {

    const visit = await Visit.create({

        tenantId: tenant._id,

        sessionId,

        customerName: "Website Visitor",

        remarks: message,

        status: "Pending"

    });

    return {

        handled: true,

        response:
`Your site visit request has been received.

Reference No: ${visit._id}

Our team will contact you shortly.`

    };

};