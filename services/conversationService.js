const leadExtractionService = require("./leadExtractionService");
const leadValidationService = require("./leadValidationService");
const leadService = require("./leadService");

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

const ChatSession = require("../models/ChatSession");

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

const emailVerificationService = require("./emailVerificationService");

if (
    lead.verificationRequestedAt &&
    /^[A-Z1-9]{4}$/i.test(message.trim())
) {

    const verified =
        await emailVerificationService.verify(
            tenantId,
            sessionId,
            message.trim()
        );

    if (verified) {

        lead.emailVerified = true;
        lead.verificationRequestedAt = null;
        lead.emailVerificationAttempts = 0;

        await leadService.save(
            tenantId,
            sessionId,
            lead
        );

return {
    handled: false,
    lead,
    sendVerification: false,
    readyForPropertySearch: true,
    nextQuestion: null,
    verificationJustSucceeded: true
};

    }

    lead.emailVerificationAttempts =
        (lead.emailVerificationAttempts || 0) + 1;

    await leadService.save(
        tenantId,
        sessionId,
        lead
    );

    if (lead.emailVerificationAttempts < 2) {

        return {
            handled: true,
            waitingForVerification: true,
            reply:
                "The verification code is incorrect. Please try again. You have one more attempt remaining."
        };

    }

lead.verificationRequestedAt = null;
lead.emailVerificationAttempts = 0;
lead.emailVerified = false;
delete lead.email;

await leadService.save(
    tenantId,
    sessionId,
    lead
);

    return {
        handled: true,
        verificationFailed: true,
        reply:
            "The verification code was incorrect twice. For security, a new verification email is required. Please provide your email address again."
    };

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
if (lead.mobile) {

    const result =
        leadValidationService.validateMobile(
            lead.mobile
        );

    if (!result.valid) {

        return {
            handled: true,
            reply: "It looks like the mobile number you entered has fewer than 10 digits. It may just be a typing mistake. Could you please confirm your 10-digit mobile number?"
        };

    }

    lead.mobile = result.value;

}

// Validate email
if (lead.email) {

    const result =
        leadValidationService.validateEmail(
            lead.email
        );

    if (!result.valid) {

        return {
            handled: true,
            reply: "That email address doesn't look valid. Could you enter it again?"
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

    sendVerification: false,

    readyForPropertySearch: false,

    nextQuestion: null

};

// Verification required
if (
    leadValidationService.needsVerification(
        lead
    )
) {

    result.sendVerification = true;

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