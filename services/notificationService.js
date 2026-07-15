const { sendWhatsApp } = require('./whatsappService');

async function notifyExecutive(executive, message) {

    if (!executive) return;

    if (!executive.mobile) return;

    try {

        await sendWhatsApp(
            executive.mobile,
            message
        );

    } catch (err) {

        console.error(err);

    }

}

module.exports = {
    notifyExecutive
};