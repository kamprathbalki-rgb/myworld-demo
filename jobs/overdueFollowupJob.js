const cron = require('node-cron');

const Buyer = require('../models/Buyer');
const Executive = require('../models/Executive');

const {
    notifyExecutive
} = require('../services/notificationService');

const { sendWhatsApp } =
require('../services/whatsappService');

cron.schedule('0 9 * * *', async () => {

    console.log('Overdue Follow Up Job');

    const today = new Date();

    today.setHours(0,0,0,0);

    const buyers = await Buyer.find({

        nextFollowUp: {
            $lt: today
        },

        status: {
            $nin: ['Deal Closed','Lost']
        },

        assignedExecutiveId: {
            $ne: null
        }

    });

    for (const buyer of buyers) {

        const executive =
        await Executive.findById(
            buyer.assignedExecutiveId
        );

        if (!executive) continue;

        const message =

`Overdue Follow Up

Buyer: ${buyer.name}

Mobile: ${buyer.phone}

Follow up overdue.`;

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