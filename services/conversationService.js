const leadExtractionService = require("./leadExtractionService");
const leadValidationService = require("./leadValidationService");
const leadService = require("./leadService");
const ChatSession = require("../models/ChatSession");
const emailVerificationService = require("./emailVerificationService");
const mobileVerificationService = require("./mobileVerificationService");

exports.reply = async (
    tenantId,
    sessionId,
    message
) => {

    // Load existing lead
let lead =
    await leadService.get(
        tenantId,
        sessionId
    );

const chatSession = await ChatSession.findOne({
    tenantId,
    sessionId
});

if (chatSession && chatSession.status === "Closed") {

    lead = null;

}

    if (!lead) {
        lead = {};
    }


if (
    emailVerificationService.isVerificationCode(
        lead,
        message
    )
) {

const verification =
    await emailVerificationService.handleVerification(
        tenantId,
        sessionId,
        lead,
        message
    );

if (verification.handled) {

    return verification;

}

lead = verification.lead;

}

// Extract information from the user's message
const extracted = await leadExtractionService.extract(
    message
);

console.log("\n========== EXTRACTED ==========");
console.dir(extracted, { depth: null });
console.log("===============================");

// Merge extracted data
Object.keys(extracted).forEach(key => {

    if (
        key === "mobileIntent" ||
        key === "emailIntent"
    ) {
        return;
    }

    if (extracted[key] === null) {

        delete lead[key];

    } else if (
        extracted[key] !== undefined &&
        extracted[key] !== ""
    ) {

        lead[key] = extracted[key];

    }

});

// Contact intent detected by AI

if (
    extracted.mobileIntent === "LATER" ||
    extracted.mobileIntent === "DECLINED"
) {
    lead.mobileDeclined = true;
}

if (extracted.mobileIntent === "PROVIDED") {
    lead.mobileDeclined = false;
}

if (
    extracted.emailIntent === "LATER" ||
    extracted.emailIntent === "DECLINED"
) {
    lead.emailDeclined = true;
}

if (extracted.emailIntent === "PROVIDED") {
    lead.emailDeclined = false;
}

// Validate mobile
const mobileVerification =
    await mobileVerificationService.process(
        tenantId,
        sessionId,
        lead
    );

if (mobileVerification.handled) {

    return mobileVerification;

}

lead = mobileVerification.lead;

// Validate email
if (lead.email) {

    const result =
        leadValidationService.validateEmail(
            lead.email
        );

    if (!result.valid) {

        return {
            handled: true,
            reply: "That email address doesn't look valid. Could you please enter a valid email address?"
        };

    }

    lead.email = result.value;

}

// Save lead
await leadService.save(
    tenantId,
    sessionId,
    lead
);

// Reload
lead = await leadService.get(
    tenantId,
    sessionId
);

const result = {

    handled: false,

    lead,

    readyForPropertySearch: false,

    nextQuestion: null

};

// Verification required
if (
    emailVerificationService.requiresVerification(
        lead
    )
) {

    result.readyForPropertySearch = false;

}

const missing =
    leadValidationService.missingFields(lead);

if (missing.length) {

    result.nextQuestion =
        leadValidationService.nextQuestion(
            missing,
            lead
        );

} else {

    result.readyForPropertySearch = true;

}

return result;

};