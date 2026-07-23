module.exports = {

    propertyShare({ buyerName, companyName }) {

        return `
            <h2>Hello ${buyerName},</h2>

            <p>Thank you for your interest in our properties.</p>

            {{PROJECT_LIST}}

            <br>

            <p>Regards,</p>

            <b>${companyName}</b>
        `;

    }

};