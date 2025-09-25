import mongoose from "mongoose";

const ConnectDb = async (MongoURL) => {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/FYP")
        console.log("MongoDB is Connected");


    } catch (error) {
        console.log("error", error);
    }
}

export default ConnectDb