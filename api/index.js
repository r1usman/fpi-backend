const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const ConnectDb = require("./Database.js");
const User = require("./models/user.model.js");
const AuthRoutes = require("./routes/AuthRoutes.js");
const { courseRouter } = require("./routes/courseRoutes.js");
const AssingmentRoutes = require("./routes/Assingment_Routes.js");
// const PartialSubmission = require("./routes/PartialSubmission_Route.js")
const NotificationRoutes = require("./routes/NotificationRoutes.js");
const app = express();
dotenv.config();

const port = process.env.Port || 3000;
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
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, path) => {
      res.set("Access-Control-Allow-Origin", "http://localhost:5173");
    },
  })
);

app.use(cookieParser());
app.use("/Auth", AuthRoutes);
app.use("/courses", courseRouter);
app.use("/Assign", AssingmentRoutes);
// app.use("/Partial", PartialSubmission)
app.use("/Notifications", NotificationRoutes);

app.get("/", async (req, res) => {
  try {
    const user = await User.find();
    res.send(user);
  } catch (error) {
    console.log("error", error);
  }
});

app.listen(port, () => {
  console.log(`App Listening at Port ${port}`);
});
