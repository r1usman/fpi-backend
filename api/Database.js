import mongoose from "mongoose";

const ConnectDb = async (MongoURL) => {
    try {
        await mongoose.connect(MongoURL)
        console.log("MongoDB is Connected");


    } catch (error) {
        console.log("error", error);
    }
}

export default ConnectDb