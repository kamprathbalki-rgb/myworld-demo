const client = require('./whatsapp');

async function sendWhatsApp(number, message) {
    try {
        const chatId = `91${number}@c.us`;

        await client.sendMessage(chatId, message);

        console.log('WhatsApp Sent');
    } catch (err) {
        console.error('WhatsApp Error:', err.message);
    }
}

module.exports = { sendWhatsApp };