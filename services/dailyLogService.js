const fs = require("fs");
const path = require("path");

function getISTDate() {
    return new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata"
    });
}

function getISTTimestamp() {

    const d = new Date();

    return {
        ts: d.toLocaleString("sv-SE", {
            timeZone: "Asia/Kolkata"
        }).replace(" ", "T") + "+05:30",

        time: d.toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour12: true
        })
    };

}

function appendDailyLog(tenantId, data) {

    const today = getISTDate();

    const folder = path.join(
        __dirname,
        "..",
        "data",
        String(tenantId),
        today
    );

    fs.mkdirSync(folder, { recursive: true });

    const file = path.join(folder, "dailylog.jsonl");

    const stamp = getISTTimestamp();

const log = {

    ts: stamp.ts,

    time: stamp.time,

    message: data

};

    fs.appendFileSync(
        file,
        JSON.stringify(log) + "\n"
    );

}

module.exports = {
    appendDailyLog
};