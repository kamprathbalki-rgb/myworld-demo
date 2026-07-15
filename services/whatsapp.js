const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const WhatsappMessage =
require('../models/WhatsappMessage');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true
    }
});

const WhatsappGroup =
require('../models/WhatsappGroup');

const WhatsappBroadcast =
require('../models/WhatsappBroadcast');

const classifyWhatsappMessage =
require('./classifyWhatsappMessage');

const WhatsappInventory =
require('../models/WhatsappInventory');

const WhatsappRequirement =
require('../models/WhatsappRequirement');

let whatsappReady = false;

client.on('qr', (qr) => {
    console.log('Scan this QR Code');
    qrcode.generate(qr, { small: true });
});

client.on('loading_screen',
(percent, message) => {

    console.log(
        'LOADING:',
        percent,
        message
    );

});

client.on(
'authenticated',
() => {

console.log(
    'AUTHENTICATED'
);

});

client.on(
'auth_failure',
(msg) => {

console.log(
    'AUTH FAILURE:',
    msg
);

});

client.on(
'disconnected',
(reason) => {

    whatsappReady = false;

    console.log(
        'DISCONNECTED:',
        reason
    );

});

client.on('ready', async () => {

    console.log('WhatsApp Ready');

    const chats =
    await client.getChats();

    const groups =
    chats.filter(c => c.isGroup);

    whatsappReady = true;

    console.log(
        'GROUP COUNT:',
        groups.length
    );

const monitoredGroups =
await WhatsappGroup.find({
    active: true
});

for (const group of monitoredGroups) {

    try {

        const chat =
        await client.getChatById(
            group.groupId
        );

        const messages =
        await chat.fetchMessages({
            limit: 100
        });

        console.log(
            'RECOVERY:',
            group.groupName,
            messages.length,
            'messages'
        );

        for (const msg of messages) {

            await WhatsappMessage.updateOne(


            {
                messageId:
                msg.id._serialized
            },

            {
                $setOnInsert: {

                    messageId:
                    msg.id._serialized,

                    groupId:
                    group.groupId,

                    groupName:
                    group.groupName,

                    sender:
                    msg.author || '',

                    message:
                    msg.body || ''

                }
            },

            {
                upsert: true
            }

            );


const type =
await classifyWhatsappMessage(
    msg.body || ''
);

await WhatsappMessage.updateOne(

{
    messageId:
    msg.id._serialized
},

{
    $set: {
        classification: type
    }
}

);

console.log(
    'CLASSIFICATION:',
    type
);

if (type === 'INVENTORY') {

await WhatsappInventory.updateOne(

{
    messageId:
    msg.id._serialized
},

{

$setOnInsert: {

    messageId:
    msg.id._serialized,

    groupName:
    chat.name,

    message:
    msg.body,

    whatsappMessageId:
    msg.id._serialized

}

},

{
    upsert: true
}

);

    console.log(
        'CLASSIFIED: INVENTORY'
    );

}

if (type === 'REQUIREMENT') {

await WhatsappRequirement.updateOne(

{
    messageId:
    msg.id._serialized
},

{

$setOnInsert: {

    messageId:
    msg.id._serialized,

    groupName:
    chat.name,

    message:
    msg.body,

    whatsappMessageId:
    msg.id._serialized

}

},

{
    upsert: true
}

);

    console.log(
        'CLASSIFIED: REQUIREMENT'
    );

}

console.log(
    'MESSAGE SAVED:',
    chat.name
);

        }

} catch (err) {

    console.log(
        'RECOVERY ERROR:',
        group.groupName
    );

    console.error(
        err
    );

}

}

    });



client.on('message', async (msg) => {

    console.log(
        'MESSAGE RECEIVED:',
        msg.from,
        msg.body
    );

    try {

const chat = await msg.getChat();

if (
    msg.from === 'status@broadcast' ||
    msg.from.includes('@newsletter')
) {

    await WhatsappBroadcast.create({

        sender: msg.from,

        message: msg.body

    });

console.log(
    'BROADCAST SAVED:',
    msg.from
);

    return;
}

if (!chat.isGroup) {
    return;
}

const monitoredGroup =
await WhatsappGroup.findOne({

    groupId: msg.from,

    active: true

});

if (!monitoredGroup) {

    console.log(
        'IGNORED GROUP:',
        chat.name
    );

    return;
}

console.log(
    'MONITORED GROUP:',
    chat.name
);

await WhatsappMessage.updateOne(

{
    messageId:
    msg.id._serialized
},

{
    $setOnInsert: {

        messageId:
        msg.id._serialized,

        groupId:
        msg.from,

        groupName:
        chat.name || '',

        sender:
        msg.author || '',

        message:
        msg.body || ''

    }
},

{
    upsert: true
}

);


const type =
await classifyWhatsappMessage(
    msg.body || ''
);

await WhatsappMessage.updateOne(

{
    messageId:
    msg.id._serialized
},

{
    $set: {
        classification: type
    }
}

);

console.log(
    'CLASSIFICATION:',
    type
);

if (type === 'INVENTORY') {

await WhatsappInventory.updateOne(

{
    messageId:
    msg.id._serialized
},

{

$setOnInsert: {

    messageId:
    msg.id._serialized,

    groupName:
    chat.name,

    message:
    msg.body,

    whatsappMessageId:
    msg.id._serialized

}

},

{
    upsert: true
}

);

    console.log(
        'CLASSIFIED: INVENTORY'
    );

}

if (type === 'REQUIREMENT') {

await WhatsappRequirement.updateOne(

{
    messageId:
    msg.id._serialized
},

{

$setOnInsert: {

    messageId:
    msg.id._serialized,

    groupName:
    chat.name,

    message:
    msg.body,

    whatsappMessageId:
    msg.id._serialized

}

},

{
    upsert: true
}

);

    console.log(
        'CLASSIFIED: REQUIREMENT'
    );

}

console.log(
    'MESSAGE SAVED:',
    chat.name
);

    } catch (err) {

        console.error(
    'WHATSAPP ERROR:',
    err.message
);

    }

});

client.on('auth_failure', (msg) => {
    console.log('Auth Failure:', msg);
});

process.on(
'SIGINT',
async () => {

    console.log(
        'SHUTTING DOWN WHATSAPP...'
    );

    try {

        await client.destroy();

    } catch (err) {

        console.log(err);

    }

    process.exit(0);

});

module.exports = {
    client,
    getReadyStatus: () => whatsappReady
};