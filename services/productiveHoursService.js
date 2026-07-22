function parseTime(timeString) {

    if (!timeString) return null;

    const match = timeString.match(
        /(\d+):(\d+):(\d+)\s*(AM|PM)/i
    );

    if (!match) return null;

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3]);
    const period = match[4].toUpperCase();

    if (period === 'PM' && hour !== 12)
        hour += 12;

    if (period === 'AM' && hour === 12)
        hour = 0;

    return (hour * 3600) + (minute * 60) + second;
}

function formatTime(totalSeconds) {

    totalSeconds = Math.max(0, Math.floor(totalSeconds));

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0')
    ].join(':');
}

function getCurrentISTSeconds() {

    const now = new Date().toLocaleTimeString(
        'en-IN',
        {
            timeZone: 'Asia/Kolkata',
            hour12: true
        }
    );

    return parseTime(now);
}

module.exports = function calculateProductiveHours(attendance) {

    if (!attendance)
        return {

            loginTime: null,
            logoutTime: null,

            teaSeconds: 0,
            lunchSeconds: 0,

            productiveSeconds: 0,
            productiveHHMMSS: "00:00:00",

            systemLogout: false

        };

    const loginTime =
        attendance.loginTimes?.[0];

    if (!loginTime)
        return {

            loginTime: null,
            logoutTime: null,

            teaSeconds: 0,
            lunchSeconds: 0,

            productiveSeconds: 0,
            productiveHHMMSS: "00:00:00",

            systemLogout: false

        };

    let logoutTime =
        attendance.logoutTimes?.[
            attendance.logoutTimes.length - 1
        ];

    let systemLogout = false;

    if (!logoutTime) {

        const nowSeconds =
            getCurrentISTSeconds();

        const autoLogout =
            parseTime("08:30:00 PM");

        if (nowSeconds >= autoLogout) {

            logoutTime = "08:30:00 PM";
            systemLogout = true;

        } else {

            logoutTime = new Date()
                .toLocaleTimeString(
                    'en-IN',
                    {
                        timeZone: 'Asia/Kolkata',
                        hour12: true
                    }
                );

        }

    }

    const loginSeconds =
        parseTime(loginTime);

    const logoutSeconds =
        parseTime(logoutTime);

    let teaSeconds = 0;

    const teaOut =
        attendance.teaOut || [];

    const teaIn =
        attendance.teaIn || [];

    for (
        let i = 0;
        i < Math.min(
            teaOut.length,
            teaIn.length
        );
        i++
    ) {

        teaSeconds +=
            parseTime(teaIn[i]) -
            parseTime(teaOut[i]);

    }

    let lunchSeconds = 0;

    const lunchOut =
        attendance.lunchOut || [];

    const lunchIn =
        attendance.lunchIn || [];

    for (
        let i = 0;
        i < Math.min(
            lunchOut.length,
            lunchIn.length
        );
        i++
    ) {

        lunchSeconds +=
            parseTime(lunchIn[i]) -
            parseTime(lunchOut[i]);

    }

    const productiveSeconds =
        Math.max(
            0,
            (logoutSeconds - loginSeconds)
            - teaSeconds
            - lunchSeconds
        );

    return {

        loginTime,

        logoutTime,

        teaSeconds,

        lunchSeconds,

        productiveSeconds,

        productiveHHMMSS:
            formatTime(productiveSeconds),

        systemLogout

    };

};