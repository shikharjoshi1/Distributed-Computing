const mongoose = require("mongoose");

const connectDB = async() =>{
    try {
        console.log('MongoDB connected:', process.env.MONGO_URI);
        
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // useFindAndModify: true,
        });

        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`Error: ${error.message}`);
        process.exit();
    }
}

module.exports= connectDB;
