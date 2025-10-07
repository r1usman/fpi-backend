require("dotenv").config();
const mongoose = require("mongoose");

const ConnectDb = async (MongoURL) => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/FYP");
    console.log("MongoDB is Connected");
  } catch (error) {
    console.log("error", error);
  }
};

module.exports = ConnectDb;
