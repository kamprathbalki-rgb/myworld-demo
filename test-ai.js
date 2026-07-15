const mongoose = require('mongoose');

require('dotenv').config();

const {
    extractWithAI
} = require('./services/whatsappAIExtractor');

(async () => {

await mongoose.connect(
    process.env.DB_URI_LOCAL ||
    process.env.DB_URI,
    {
        dbName: 'myworld',
        authSource: 'admin'
    }
);
    const result =
    await extractWithAI(`
Need 1BHK in Kharadi 25000

Need 2BHK in Viman Nagar 35000

Need PG in Magarpatta 8000
`);

       console.log(
        JSON.stringify(
            result,
            null,
            2
        )
    );

    await mongoose.disconnect();

})();