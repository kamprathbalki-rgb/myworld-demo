// utils/dateUtils.js

function getISTDate() {
    return new Date().toLocaleDateString(
        'en-CA',
        {
            timeZone: 'Asia/Kolkata'
        }
    )
}

function getISTTime() {
    return new Date().toLocaleTimeString(
        'en-IN',
        {
            timeZone: 'Asia/Kolkata',
            hour12: true
        }
    )
}

function getISTDateTime() {
    return new Date().toLocaleString(
        'en-IN',
        {
            timeZone: 'Asia/Kolkata',
            hour12: true
        }
    )
}

module.exports = {
    getISTDate,
    getISTTime,
    getISTDateTime
}