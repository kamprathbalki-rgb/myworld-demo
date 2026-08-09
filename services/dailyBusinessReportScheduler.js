const cron = require("node-cron");
const Tenant = require("../models/Tenant");
const {
    sendDailyBusinessReport
} = require("./sendDailyBusinessReport");

cron.schedule(
    "0 21 * * *",
    async () => {

        console.log("Running Daily Business Reports...");

        const tenants = await Tenant.find({
            isActive: true
        });

        for (const tenant of tenants) {

            try {

await sendDailyBusinessReport(
    tenant._id
);

                console.log(
                    `${tenant.name} completed`
                );

            } catch (err) {

                console.error(
                    tenant.name,
                    err.message
                );

            }

        }

    },
    {
        timezone: "Asia/Kolkata"
    }
);

console.log("Daily Business Report Scheduler Started");