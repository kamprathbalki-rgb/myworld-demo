const cron = require('node-cron');

const Executive = require('../models/Executive');
const Buyer = require('../models/Buyer');

const {
    notifyExecutive
} = require('../services/notificationService');

cron.schedule('0 19 * * *', async () => {

    console.log('Daily Summary Job');

    const executives =
    await Executive.find({
        isActive: true
    });

    for (const executive of executives) {

        const leads =
        await Buyer.countDocuments({
            assignedExecutiveId: executive._id
        });

        const closed =
        await Buyer.countDocuments({
            assignedExecutiveId: executive._id,
            status: 'Deal Closed'
        });

        const followups =
        await Buyer.countDocuments({
            assignedExecutiveId: executive._id,
            status: {
                $nin: ['Deal Closed','Lost']
            }
        });

        await notifyExecutive(

            executive,

            `Daily Summary

Total Leads: ${leads}

Open Leads: ${followups}

Deals Closed: ${closed}`

        );

    }

});