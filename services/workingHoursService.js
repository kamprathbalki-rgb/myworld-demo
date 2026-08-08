function toSeconds(t) {

    if (!t) return 0;

    const [time, ap] = t.split(" ");

    let [h, m, s] = time.split(":").map(Number);

    if (ap === "PM" && h !== 12) h += 12;

    if (ap === "AM" && h === 12) h = 0;

    return h * 3600 + m * 60 + s;

}

function format(sec) {

    const h = String(Math.floor(sec / 3600)).padStart(2, "0");

    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");

    const s = String(sec % 60).padStart(2, "0");

    return `${h}:${m}:${s}`;

}

function getISTNow() {

    return new Date().toLocaleTimeString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            hour12: true
        }
    );

}

function calculateWorkingHours(attendance) {

    if (
        !attendance ||
        !attendance.loginTimes ||
        attendance.loginTimes.length === 0
    ) {

        return {

            workingSeconds: 0,

            workingHHMMSS: "00:00:00"

        };

    }

    const firstLogin =
        attendance.loginTimes[0];

    const endTime =
        attendance.logoutTimes &&
        attendance.logoutTimes.length > 0
            ? attendance.logoutTimes[
                attendance.logoutTimes.length - 1
              ]
            : getISTNow();

    const start =
        toSeconds(firstLogin);

    const end =
        toSeconds(endTime);

    const workingSeconds =
        Math.max(0, end - start);

return {

    workingSeconds,

    workingHHMMSS:
        format(workingSeconds),

    systemLogout:
        attendance.logoutTimes &&
        attendance.logoutTimes.length > 0,

    lastLogoutTime:
        attendance.logoutTimes &&
        attendance.logoutTimes.length > 0
            ? attendance.logoutTimes[
                attendance.logoutTimes.length - 1
              ]
            : null

};

}

module.exports =
    calculateWorkingHours;