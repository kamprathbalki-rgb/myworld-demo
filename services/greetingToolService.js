exports.execute = async (tenant) => {

    let greeting = `Welcome to ${tenant.companyName}.`;

    if (tenant.businessDescription) {

        greeting += `

${tenant.businessDescription}`;

    }

    greeting += `

How can I help you today?`;

    return {

        handled: true,

        response: greeting

    };

};