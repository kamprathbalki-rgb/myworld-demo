exports.validate = (mobile) => {

    if (!mobile) {
        return {
            valid: false,
            message: "Kindly provide me 10-digit mobile number. Country code is not required"
        };
    }

    const value =
        mobile.replace(/\D/g, "");

    if (value.length !== 10) {
        return {
            valid: false,
            message: `I have received "${value}" as your mobile number. Could you please confirm and provide it again is it incorrect? Thank you.`
        };
    }

    return {
        valid: true,
        value
    };

};

exports.process = async (
    tenantId,
    sessionId,
    lead
) => {

console.log("\n===== MOBILE PROCESS START =====");
console.log("Incoming lead:", JSON.stringify(lead, null, 2));

if (!lead?.mobile) {
    return {
        handled: false,
        lead
    };
}

    const result =
        exports.validate(
            lead.mobile
        );

if (!result.valid) {

    lead.mobileValidationAttempts =
        (lead.mobileValidationAttempts || 0) + 1;

    lead.awaitingMobileConfirmation = true;

    if (lead.mobileValidationAttempts < 2) {

const leadService =
    require("./leadService");

await leadService.save(
    tenantId,
    sessionId,
    lead
);

return {
    handled: true,
    lead,
    reply: result.message
};

    }

lead.mobileValidationAttempts = 0;
lead.awaitingMobileConfirmation = false;
delete lead.mobile;
lead.mobileDeclined = true;

return {
    handled: true,
    lead,
    reply: `The mobile number appears to be invalid. I'll continue without your mobile number. Please describe your property requirement.`
};

}

    lead.mobile = result.value;

    return {
        handled: false,
        lead,
        reply: `I have received incorrect "${result.value}" again. It doesn't appear to be a 10-digit number. Let's continue without it. `
    };

};