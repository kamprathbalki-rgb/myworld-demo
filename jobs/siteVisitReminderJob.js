const cron = require('node-cron');

const BuyerProjectVisit =
require('../models/BuyerProjectVisit');

const Executive =
require('../models/Executive');

const {
    notifyExecutive
} = require('../services/notificationService');

cron.schedule('0 17 * * *', async () => {

    console.log('Tomorrow Site Visit Reminder Job');

    const tomorrow = new Date();

    tomorrow.setDate(
        tomorrow.getDate() + 1
    );

    tomorrow.setHours(0,0,0,0);

    const dayAfter = new Date(tomorrow);

    dayAfter.setDate(
        tomorrow.getDate() + 1
    );

    const visits =
    await BuyerProjectVisit.find({

        scheduledVisitDate: {
            $gte: tomorrow,
            $lt: dayAfter
        }

    });

    for (const visit of visits) {

        const executive =
        await Executive.findById(
            visit.executiveId
        );

        if (!executive) continue;

        await notifyExecutive(

            executive,

            `Tomorrow Site Visit

Buyer: ${visit.buyerName}

Project: ${visit.projectName}

Date:
${visit.scheduledVisitDate.toLocaleDateString()}`

        );

    }

});