const clients = require('./clientManager')
const TenantWhatsapp = require('../../models/TenantWhatsapp')
const qrStore = require('./qrStore')
const { Client, LocalAuth } = require('whatsapp-web.js');

const WhatsappMessage =
require('../../models/WhatsappMessage')

const WhatsappGroup =
require('../../models/WhatsappGroup')

const WhatsappBroadcast =
require('../../models/WhatsappBroadcast')

const WhatsappInventory =
require('../../models/WhatsappInventory')

const WhatsappRequirement =
require('../../models/WhatsappRequirement')

const classifyWhatsappMessage =
require('../classifyWhatsappMessage')

const {
    extractWithAI
} = require('../whatsappAIExtractor');

async function createClient(
tenantId
) {

if (
clients[tenantId]
) {

return clients[tenantId]

}

const client =
new Client({

authStrategy:
new LocalAuth({

clientId:
`tenant_${tenantId}`

}),

puppeteer: {

headless: true,

executablePath:
'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',

args: [
'--no-sandbox',
'--disable-setuid-sandbox'
]

}

})

clients[tenantId] =
client

client.on(
'authenticated',
async () => {

console.log(
'WHATSAPP AUTHENTICATED:',
tenantId
)

await TenantWhatsapp.updateOne(
{
tenantId
},
{
$set: {
clientId:
`tenant_${tenantId}`,
isAuthenticated: true,
lastConnectedAt:
new Date()
}
},
{
upsert: true
}
)

}
)

client.on(
'qr',
(qr)=>{

qrStore[
tenantId
] = qr

console.log(
'QR GENERATED',
tenantId
)

}
)

client.on(
'ready',
async () => {

console.log(
'WHATSAPP READY:',
tenantId
)

console.log(
'CLIENT INFO:',
client.info
)

const info =
client.info

await TenantWhatsapp.findOneAndUpdate(

{
tenantId
},

{
phoneNumber:
info?.wid?.user || '',

lastConnectedAt:
new Date(),

isAuthenticated:
true
}

)

const chats =
await client.getChats()

const groups =
chats.filter(
c => c.isGroup
)

console.log(
'GROUP COUNT:',
groups.length
)

const monitoredGroups =
await WhatsappGroup.find({

tenantId:
tenantId,

active: true

})

for (const group of monitoredGroups) {

try {

const chat =
await client.getChatById(
group.groupId
)

const messages =
await chat.fetchMessages({
limit: 500
})

console.log(
'RECOVERY:',
group.groupName,
messages.length,
'messages'
)

for (const msg of messages) {

const contact =
await msg.getContact();

console.log(
'RECOVERY AUTHOR:',
msg.author
);

console.log(
'RECOVERY CONTACT:',
JSON.stringify(
contact,
null,
2
)
);

await WhatsappMessage.updateOne(

{
messageId:
msg.id._serialized
},

{
$set: {

tenantId:
group.tenantId

},

$setOnInsert: {

messageId:
msg.id._serialized,

groupId:
group.groupId,

groupName:
group.groupName,

senderId:
msg.author || '',

senderName:
contact.pushname ||
contact.name ||
'',

senderPhone:
contact.id?.user ||
'',

message:
msg.body || ''

}
},

{
upsert: true
}

)

const type =
await classifyWhatsappMessage(
msg.body || ''
)

console.log(
    'EXTRACT START:',
    new Date().toISOString()
);

if (!msg.body || !msg.body.trim()) {

    console.log(
        'SKIPPING EMPTY MESSAGE'
    );

    continue;
}

const aiData =
await extractWithAI(
    msg.body || ''
)

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

)

if (
type === 'REQUIREMENT'
) {

const records =
aiData?.records || [];

for (
let i = 0;
i < records.length;
i++
) {

const record =
records[i];

await WhatsappRequirement.create({

tenantId:
group.tenantId,

messageId:
`${msg.id._serialized}_${i}`,

whatsappMessageId:
msg.id._serialized,

groupName:
group.groupName,

message:
msg.body,

senderId:
msg.author || '',

senderName:
contact.pushname ||
contact.name ||
'',

senderPhone:
contact.id?.user ||
'',

propertyType:
record.propertyType || null,

transactionType:
record.transactionType || null,

bhk:
record.bhk || null,

location:
record.location || null,

area:
record.area || null,

areaUnit:
record.areaUnit || null,

budget:
record.budget || null,

contactNumbers:
aiData?.contactNumbers || [],

confidence:
aiData?.confidence || null,

summary:
aiData?.summary || null

});

}

console.log(
'CLASSIFIED: REQUIREMENT',
records.length,
'RECORDS'
);

}

if (
type === 'INVENTORY'
) {

const records =
aiData?.records || [];

for (
let i = 0;
i < records.length;
i++
) {

const record =
records[i];

await WhatsappInventory.create({

tenantId:
group.tenantId,

messageId:
`${msg.id._serialized}_${i}`,

whatsappMessageId:
msg.id._serialized,

groupName:
group.groupName,

message:
msg.body,

senderId:
msg.author || '',

senderName:
contact.pushname ||
contact.name ||
'',

senderPhone:
contact.id?.user ||
'',

propertyType:
record.propertyType || null,

transactionType:
record.transactionType || null,

bhk:
record.bhk || null,

location:
record.location || null,

area:
record.area || null,

areaUnit:
record.areaUnit || null,

budget:
record.budget || null,

contactNumbers:
aiData?.contactNumbers || [],

confidence:
aiData?.confidence || null,

summary:
aiData?.summary || null

});

}

console.log(
'CLASSIFIED: INVENTORY',
records.length,
'RECORDS'
);

}

}

} catch (err) {

    console.log(
        'RECOVERY ERROR:',
        group.groupName,
        err.message
    );

}
}
}
);

client.on('message', async (msg) => {

console.log('TENANT MESSAGE EVENT FIRED');

    console.log(
        'LIVE:',
        msg.from
    );

    console.log(
        'MESSAGE RECEIVED:',
        msg.from,
        msg.body
    );

    try {

const chat = await msg.getChat();

const contact =
await msg.getContact();

console.log(
'RECOVERY AUTHOR:',
msg.author
);

console.log(
'RECOVERY CONTACT:',
JSON.stringify(
contact,
null,
2
)
);


if (
    msg.from === 'status@broadcast' ||
    msg.from.includes('@newsletter')
) {

    await WhatsappBroadcast.create({

tenantId:
    tenantId,

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
    $set: {

        tenantId:
        monitoredGroup.tenantId

    },

    $setOnInsert: {

        messageId:
        msg.id._serialized,

        groupId:
        msg.from,

        groupName:
        chat.name || '',

senderId:
msg.author || '',

senderName:
contact.pushname ||
contact.name ||
'',

senderPhone:
contact.id?.user ||
'',

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

console.log(
    'EXTRACT START:',
    new Date().toISOString()
);

if (!msg.body || !msg.body.trim()) {

    console.log(
        'SKIPPING EMPTY MESSAGE'
    );

    return;
}

const aiData =
await extractWithAI(
    msg.body || ''
)

console.log(
    'AI DATA:',
    aiData
);

console.log(
    'AI USAGE:',
    aiData?.aiUsage
);

console.log(
    'AI TYPE:',
    typeof aiData
);

await WhatsappMessage.updateOne(

{
    messageId:
    msg.id._serialized
},

{
    $set: {

        classification:
        type,

aiData:
aiData,

aiUsage:
aiData?.aiUsage || {},

aiProcessedAt:
        new Date()

    }
}

);

console.log(
    'CLASSIFICATION:',
    type
);

if (type === 'INVENTORY') {

    const records =
    aiData?.records || [];

    for (let i = 0; i < records.length; i++) {

        const record =
        records[i];

        await WhatsappInventory.create({

            tenantId:
            monitoredGroup.tenantId,

            messageId:
            `${msg.id._serialized}_${i}`,

            whatsappMessageId:
            msg.id._serialized,

            groupName:
            chat.name,

            message:
            msg.body,

            senderId:
            msg.author || '',

            senderName:
            contact.pushname ||
            contact.name ||
            '',

            senderPhone:
            contact.id?.user ||
            '',

            propertyType:
            record.propertyType || null,

            transactionType:
            record.transactionType || null,

            bhk:
            record.bhk || null,

            location:
            record.location || null,

            area:
            record.area || null,

            areaUnit:
            record.areaUnit || null,

            budget:
            record.budget || null,

            contactNumbers:
            aiData?.contactNumbers || [],

            confidence:
            aiData?.confidence || null,

            summary:
            aiData?.summary || null

        });

    }

    console.log(
        'CLASSIFIED: INVENTORY',
        records.length,
        'RECORDS'
    );

}

if (type === 'REQUIREMENT') {

    const records =
    aiData?.records || [];

    for (let i = 0; i < records.length; i++) {

        const record =
        records[i];

        await WhatsappRequirement.create({

            tenantId:
            monitoredGroup.tenantId,

            messageId:
            `${msg.id._serialized}_${i}`,

            whatsappMessageId:
            msg.id._serialized,

            groupName:
            chat.name,

            message:
            msg.body,

            senderId:
            msg.author || '',

            senderName:
            contact.pushname ||
            contact.name ||
            '',

            senderPhone:
            contact.id?.user ||
            '',

            propertyType:
            record.propertyType || null,

            transactionType:
            record.transactionType || null,

            bhk:
            record.bhk || null,

            location:
            record.location || null,

            area:
            record.area || null,

            areaUnit:
            record.areaUnit || null,

            budget:
            record.budget || null,

            contactNumbers:
            aiData?.contactNumbers || [],

            confidence:
            aiData?.confidence || null,

            summary:
            aiData?.summary || null

        });

    }

    console.log(
        'CLASSIFIED: REQUIREMENT',
        records.length,
        'RECORDS'
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

client.on(
'disconnected',
(reason) => {

console.log(
'WHATSAPP DISCONNECTED:',
tenantId,
reason
)

delete clients[tenantId]

}
)

await client.initialize()

return client

}

module.exports =
createClient