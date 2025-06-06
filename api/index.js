import express from "express";
import dotenv from "dotenv";

import ConnectDb from "./Database.js";

import User from "./models/user.model.js";

import AuthRoutes from "./routes/AuthRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
dotenv.config();

const port = process.env.Port;
const MongoURL = process.env.MONGO;

ConnectDb(MongoURL);

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());

app.use("/api/Auth", AuthRoutes);

app.get("/", async (req, res) => {
  try {
    const user = await User.find();
    res.send(user);
  } catch (error) {
    console.log("error", error);
  }
});

app.listen(3000, () => {
  console.log("App Listening at Port 3000");
});
