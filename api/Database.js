const mongoose = require("mongoose");

const ConnectDb = async (MongoURL) => {
  try {
    // mongodb://127.0.0.1:27017/FYP
    await mongoose.connect(MongoURL);
    console.log("MongoDB is Connected");
  } catch (error) {
    console.log("error", error);
  }
};

module.exports = ConnectDb;
