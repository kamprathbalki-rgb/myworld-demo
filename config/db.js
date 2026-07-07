const mongoose = require('mongoose')

const connectDB = async () => {
    try {

        await mongoose.connect(process.env.DB_URI_NEW)

        console.log("MongoDB Connected")

    } catch (error) {

        console.error("DB_URI_NEW =", process.env.DB_URI_NEW)
        console.error("MongoDB Connection Error:", error)

        process.exit(1)
    }
}

module.exports = connectDB