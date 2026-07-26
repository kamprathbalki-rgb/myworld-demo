const leadService = require("./leadService");
const emailVerificationService = require("./emailVerificationService");

exports.process = async (
    tenantId,
    sessionId,
    lead
) => {

if (
    !lead ||
    !lead.mobile ||
    !lead.email
) {
    return {
        handled: false
    };
}

if (
    lead.mobileVerified &&
    lead.emailVerified
) {
    return {
        handled: false
    };
}

if (lead.verificationRequestedAt) {
    return {
        handled: true,
        reply: "A verification code has already been sent to your email. Please enter the code."
    };
}

    // TODO
    // mobileVerificationService.create(...)
    // mobileVerificationService.send(...)

    const code =
        await emailVerificationService.create(
            tenantId,
            sessionId,
            lead.email
        );

    await emailVerificationService.sendCode(
        lead.email,
        code
    );

    await leadService.save(
        tenantId,
        sessionId,
        {
            verificationRequestedAt: new Date()
        }
    );

return {
    handled: true,
    reply: "I've sent a verification code to your email address. Please enter the code to continue."
};

};

exports.isExpired = (lead) => {

    if (!lead?.verificationRequestedAt)
        return false;

    const age =
        Date.now() -
        new Date(
            lead.verificationRequestedAt
        ).getTime();

    return age > 5 * 60 * 1000;

};

exports.reset = async (
    tenantId,
    sessionId
) => {

    await leadService.save(
        tenantId,
        sessionId,
        {
            verificationRequestedAt: null
        }
    );

};