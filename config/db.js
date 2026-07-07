const mongoose = require('mongoose')

const connectDB = async () => {
    try {

        console.log("DB_URI =", process.env.DB_URI)

        await mongoose.connect(process.env.DB_URI)

        console.log("MongoDB Connected")

    } catch (error) {

        console.error("DB_URI =", process.env.DB_URI)
        console.error("MongoDB Connection Error:", error)

        process.exit(1)
    }
}

module.exports = connectDB