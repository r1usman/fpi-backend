import express from "express"
import dotenv from "dotenv"

import ConnectDb from "./Database.js"

import User from "./models/user.model.js"

import AuthRoutes from "./routes/AuthRoutes.js"


const app = express()
dotenv.config()

const port = process.env.Port;
const MongoURL = process.env.MONGO;

ConnectDb(MongoURL)

app.use(express.json());




app.use("/api/Auth", AuthRoutes)

app.get("/", async (req, res) => {
  try {
    const user = await User.find();
    console.log(user);

  } catch (error) {
    console.log("error", error);

  }
})

app.listen(port, () => {
  console.log("App Listening at Port 3000");

})