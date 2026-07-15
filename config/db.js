const mongoose = require('mongoose')

const connectDB = async () => {
    try {

        const dbUri =
            process.env.DB_URI_LOCAL ||
            process.env.DB_URI

        await mongoose.connect(dbUri, {
            dbName: 'myworld',
            authSource: 'admin'
        })

        console.log("MongoDB Connected")

    } catch (error) {

        console.error("MongoDB Connection Error:", error)

        process.exit(1)
    }
}

module.exports = connectDB