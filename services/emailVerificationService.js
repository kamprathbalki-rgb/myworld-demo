const crypto = require("crypto");
const EmailVerification = require("../models/EmailVerification");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000
});

exports.generateCode = () => {

    const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
    let code = "";

    for (let i = 0; i < 4; i++) {
        code += chars[
            crypto.randomInt(chars.length)
        ];
    }

    return code;

};

exports.validateEmail = (lead) => {

    if (!lead?.email) {
        return {
            valid: false,
            message: "Please provide your email address."
        };
    }

    const value =
        lead.email.trim().toLowerCase();

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return {
            valid: true,
            value
        };
    }

    lead.emailValidationAttempts =
        (lead.emailValidationAttempts || 0) + 1;

    if (lead.emailValidationAttempts < 2) {
        return {
            valid: false,
            lead,
            message: `I have received "${value}" as your email address. Could you please confirm and provide it again if it is incorrect? Thank you.`
        };
    }

lead.emailValidationAttempts = 0;
delete lead.email;
lead.emailDeclined = true;

return {
    valid: false,
    lead,
    message: "The email address appears to be invalid. I'll continue without your email address. Please describe your property requirement."
};

};

exports.create = async (tenantId, sessionId, email) => {

    const code = exports.generateCode();

    const expiresAt = new Date(
        Date.now() + 5 * 60 * 1000
    );

    await EmailVerification.findOneAndUpdate(
        {
            tenantId,
            sessionId
        },
        {
            email,
            code,
            verified: false,
            expiresAt
        },
        {
            upsert: true,
            new: true
        }
    );

setTimeout(async () => {

    try {

        await EmailVerification.deleteOne({
            tenantId,
            sessionId
        });

    } catch (err) {

        console.error("OTP cleanup failed:", err);

    }

}, 5 * 60 * 1000);

    return code;

};

exports.sendCode = async (email, code) => {

    console.log("SMTP Config:", {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM
    });

    await transporter.verify();
    console.log("SMTP connection verified.");

    await transporter.sendMail({

        from: process.env.SMTP_FROM,

        to: email,

        subject: "Verify Your Email Address",

        html: `...`

    });

};

exports.verify = async (
    tenantId,
    sessionId,
    code
) => {

    const record =
        await EmailVerification.findOne({
            tenantId,
            sessionId
        });

    if (!record)
        return false;

    if (record.expiresAt < new Date()) {

        await EmailVerification.deleteOne({
            tenantId,
            sessionId
        });

        return false;

    }

    if (
        record.code.toUpperCase() !==
        code.toUpperCase()
    ) {
        return false;
    }

    await EmailVerification.deleteOne({
        tenantId,
        sessionId
    });

    return true;

};

exports.handleVerification = async (
    tenantId,
    sessionId,
    lead,
    message
) => {

    const verified =
        await exports.verify(
            tenantId,
            sessionId,
            message.trim()
        );

    if (verified) {

        lead =
            await exports.completeVerification(
                tenantId,
                sessionId,
                lead
            );

        return {
            handled: false,
            lead,
            verificationJustSucceeded: true
        };

    }

    return await exports.failVerification(
        tenantId,
        sessionId,
        lead
    );

};

exports.process = async (
    tenantId,
    sessionId,
    lead
) => {

    if (!exports.requiresVerification(lead)) {
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

const code =
    await exports.create(
        tenantId,
        sessionId,
        lead.email
    );

lead.verificationRequestedAt = new Date();

const leadService =
    require("./leadService");

await leadService.save(
    tenantId,
    sessionId,
    lead
);

try {

    await exports.sendCode(
        lead.email,
        code
    );

    return {
        handled: true,
        lead,
        reply: "I've sent a verification code to your email address. Please enter the code to continue."
    };

} catch (err) {

    console.error("Failed to send verification email:", err);

    return {
        handled: true,
        lead,
        reply: "I couldn't send the verification email due to a temporary issue. Please try again in a few moments."
    };

}

};

exports.completeVerification = async (
    tenantId,
    sessionId,
    lead
) => {

    lead.emailVerified = true;
    lead.verificationRequestedAt = null;
    lead.emailVerificationAttempts = 0;

    const leadService =
        require("./leadService");

    await leadService.save(
        tenantId,
        sessionId,
        lead
    );

    return lead;

};

exports.requiresVerification = (
    lead
) => {

    if (!lead)
        return false;

    if (!lead.mobile)
        return false;

    if (!lead.email)
        return false;

    if (lead.emailVerified)
        return false;

    return true;

};

exports.canSendVerification = (
    lead
) => {

    return (
        exports.requiresVerification(
            lead
        ) &&
        !lead.verificationRequestedAt
    );

};

exports.isVerificationCode = (
    lead,
    message
) => {

    if (
        !lead?.verificationRequestedAt
    ) {
        return false;
    }

    return /^[A-Z0-9]{4}$/i.test(
        message.trim()
    );

};

exports.isVerified = async (tenantId, sessionId) => {

    const record = await EmailVerification.findOne({
        tenantId,
        sessionId,
        verified: true
    });

    return !!record;

};

exports.failVerification = async (
    tenantId,
    sessionId,
    lead
) => {

    lead.emailVerificationAttempts =
        (lead.emailVerificationAttempts || 0) + 1;

    if (lead.emailVerificationAttempts < 2) {

        const leadService =
            require("./leadService");

        await leadService.save(
            tenantId,
            sessionId,
            lead
        );

        return {
            handled: true,
            reply: "The verification code is incorrect. Please try again. You have one more attempt remaining."
        };

    }

    lead.verificationRequestedAt = null;
    lead.emailVerificationAttempts = 0;
    lead.emailVerified = false;
    delete lead.email;

    const leadService =
        require("./leadService");

    await leadService.save(
        tenantId,
        sessionId,
        lead
    );

    return {
        handled: true,
        reply: "The verification code was incorrect twice. For security, a new verification email is required. Please provide your email address again."
    };

};

exports.isAwaitingVerification = (
    lead
) => {

    return (
    exports.requiresVerification(
        lead
    ) &&
    !!lead.verificationRequestedAt
);

};

exports.isAwaitingVerification = (
    lead
) => {

    return (
        exports.requiresVerification(
            lead
        ) &&
        !!lead.verificationRequestedAt
    );

};

