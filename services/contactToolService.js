exports.execute = async (tenant) => {

    let answer = "";

    if (tenant.companyName)
        answer += `Company: ${tenant.companyName}\n`;

    if (tenant.address)
        answer += `Address: ${tenant.address}\n`;

    if (tenant.phone)
        answer += `Phone: ${tenant.phone}\n`;

    if (tenant.email)
        answer += `Email: ${tenant.email}\n`;

    if (tenant.website)
        answer += `Website: ${tenant.website}\n`;

    return {
        handled: true,
        response: answer.trim()
    };

};