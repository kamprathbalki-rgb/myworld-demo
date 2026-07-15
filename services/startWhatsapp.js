module.exports = function () {

    console.log(
        'STARTING WHATSAPP...'
    );

const {
    client
} = require('./whatsapp');

    client.initialize();

}