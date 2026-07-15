const mongoose =
require('mongoose');

require('dotenv').config();

const WhatsappInventory =
require('./models/WhatsappInventory');

(async () => {

await mongoose.connect(
    process.env.DB_URI_LOCAL ||
    process.env.DB_URI,
    {
        dbName: 'myworld',
        authSource: 'admin'
    }
);

const aiData = {

    multipleRecords: true,

    records: [

        {
            propertyType: 'APARTMENT',
            transactionType: 'RENT',
            bhk: 1,
            location: 'A',
            budget: 25000
        },

        {
            propertyType: 'APARTMENT',
            transactionType: 'RENT',
            bhk: 2,
            location: 'B',
            budget: 35000
        }

    ]

};

for (
    let i = 0;
    i < aiData.records.length;
    i++
) {

    const record =
    aiData.records[i];

    await WhatsappInventory.create({

        tenantId:
        new mongoose.Types.ObjectId(),

        messageId:
        `TEST_${i}`,

        whatsappMessageId:
        'TEST',

        groupName:
        'TEST',

        message:
        'TEST',

        propertyType:
        record.propertyType,

        transactionType:
        record.transactionType,

        bhk:
        record.bhk,

        location:
        record.location,

        budget:
        record.budget

    });

}

console.log(
    'INSERTED:',
    aiData.records.length
);

await mongoose.disconnect();

})();