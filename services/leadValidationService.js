exports.validateMobile = (mobile) => {

    if (!mobile) {
        return {
            valid: false,
            reason: "missing"
        };
    }

    const cleaned = mobile.replace(/\D/g, "");

    if (cleaned.length !== 10) {
        return {
            valid: false,
            reason: "invalid"
        };
    }

    return {
        valid: true,
        value: cleaned
    };

};

exports.validateEmail = (email) => {

    if (!email) {
        return {
            valid: false,
            reason: "missing"
        };
    }

    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!valid) {
        return {
            valid: false,
            reason: "invalid"
        };
    }

    return {
        valid: true,
        value: email.trim().toLowerCase()
    };

};

exports.needsVerification = (lead) => {

    return (
        lead.mobile &&
        lead.email &&
        (
            !lead.mobileVerified ||
            !lead.emailVerified
        )
    );

};

exports.missingFields = (lead) => {

    const missing = [];

if (!lead.propertyCategory)
    missing.push("propertyCategory");

if (!lead.location)
    missing.push("location");

if (!lead.propertyType)
    missing.push("propertyType");

if (!lead.configuration)
    missing.push("configuration");

if (!lead.budget)
    missing.push("budget");

if (!lead.name && !lead.nameDeclined)
    missing.push("name");

if (!lead.mobile && !lead.mobileDeclined)
    missing.push("mobile");

if (!lead.email && !lead.emailDeclined)
    missing.push("email");

    return missing;

};

exports.nextQuestion = (missing, lead = {}) => {

    if (!missing.length) {
        return null;
    }

    const asked = new Set(
        Object.keys(lead)
            .filter(k => lead[k] !== undefined && lead[k] !== null && lead[k] !== "")
    );

    if (
        asked.has("location") &&
        asked.has("propertyType") &&
        asked.has("configuration") &&
        !asked.has("budget")
    ) {
        return "budget";
    }

    if (
        asked.has("budget") &&
        !asked.has("name")
    ) {
        return "name";
    }

    if (
        asked.has("name") &&
        !asked.has("mobile")
    ) {
        return "mobile";
    }

    if (
        asked.has("name") &&
        !asked.has("email")
    ) {
        return "email";
    }

    return missing[0];

};