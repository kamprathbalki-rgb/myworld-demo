const cron = require('node-cron');

const Buyer = require('../models/Buyer');
const Executive = require('../models/Executive');

const {
    notifyExecutive
} = require('../services/notificationService');

const {
    sendWhatsApp
} = require('../services/whatsappService');

cron.schedule('0 10 * * *', async () => {

    console.log('Uncontacted Lead Job');

    const yesterday = new Date();

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    const buyers = await Buyer.find({

        assignedExecutiveId: {
            $ne: null
        },

        status: 'New Lead',

        createdAt: {
            $lt: yesterday
        }

    });

    for (const buyer of buyers) {

        const executive =
        await Executive.findById(
            buyer.assignedExecutiveId
        );

        if (!executive) continue;

        const message =

`Lead Not Contacted

Buyer: ${buyer.name}

Mobile: ${buyer.phone}

Lead assigned more than 1 day ago.`;

        await notifyExecutive(
            executive,
            message
        );

        await sendWhatsApp(
            '9503728537',
            message
        );

    }

});