const cron = require('node-cron');

const Buyer = require('../models/Buyer');
const Executive = require('../models/Executive');

const {
    notifyExecutive
} = require('../services/notificationService');

cron.schedule('0 8 * * *', async () => {

    console.log('Follow Up Reminder Job');

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(today.getDate() + 1);

    const buyers = await Buyer.find({

        nextFollowUp: {
            $gte: today,
            $lt: tomorrow
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

        await notifyExecutive(

            executive,

            `Today's Follow Up

Buyer: ${buyer.name}

Mobile: ${buyer.phone}`

        );

    }

});