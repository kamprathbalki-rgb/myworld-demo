const mongoose = require('mongoose')

const connectDB = async () => {
    try {

        await mongoose.connect(
    process.env.MONGODB_URI || process.env.DB_URI
)

    } catch (error) {

        console.error("DB_URI =", process.env.DB_URI)
        console.error("MongoDB Connection Error:", error)

        process.exit(1)
    }
}

module.exports = connectDB