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
    }

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

exports.isValidEmail = (email) => {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

    await transporter.sendMail({

        from: process.env.SMTP_FROM,

        to: email,

        subject: "Verify Your Email Address",

        html: `
            <h2>Email Verification</h2>

            <p>Your verification code is:</p>

            <h1 style="letter-spacing:5px">${code}</h1>

            <p>To be protected and for security, please enter the code within 3 minutes.</p>

            <p>If you did not request this verification, you can safely ignore the email.</p>
        `

    });

};

exports.verify = async (tenantId, sessionId, code) => {

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
    )
        return false;

await EmailVerification.deleteOne({
    tenantId,
    sessionId
});

return true;

};

exports.isVerified = async (tenantId, sessionId) => {

    const record = await EmailVerification.findOne({
        tenantId,
        sessionId,
        verified: true
    });

    return !!record;

};

