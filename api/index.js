import express from "express";
import dotenv from "dotenv";

import ConnectDb from "./Database.js";

import User from "./models/user.model.js";

import AuthRoutes from "./routes/AuthRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { courseRouter } from "./routes/courseRoutes.js";

const app = express();
dotenv.config();

const port = process.env.Port;
console.log("Port", port);

const MongoURL = process.env.MONGO;
console.log("MongoURL", MongoURL);

ConnectDb(MongoURL);

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());

app.use("/Auth", AuthRoutes);
app.use("/courses", courseRouter);

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
