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
const AssingmentRoutes = require("./routes/Assingment_Routes.js")
const NotificationRoutes = require("./routes/NotificationRoutes.js")
const PartialAssingment = require("./routes/PartialSubmission_Route.js")
const PartialSubmission_Model = require("./models/PartialSubmission_Model.js")
const Assingment_Model = require("./models/Assingment_Model.js")

const app = express();
dotenv.config();

const { Server } = require("socket.io");
const { createServer } = require("http");
const server = createServer(app);
const io = new Server(server, {
  cors: {
    credentials: true,
    origin: "http://localhost:5173",
  },
});

const onlineUsers = {};

io.on("connection", (socket) => {
  console.log(socket.id, "Connected");

  socket.on("joinGroup", async ({ assignmentId, User }) => {

    onlineUsers[User._id] = socket.id;
    socket.emit("updateOnlineStatus", Object.keys(onlineUsers));


    const assignment = await Assingment_Model.findById(assignmentId);
    if (!assignment) return;


    let groupIndex = null;
    assignment.settings.groupSettings.groupsDetail.forEach((group, idx) => {
      if (group.some(student => student._id.toString() === User._id)) {
        groupIndex = idx;
      }
    });

    if (groupIndex === null) return;

    const groupName = `${assignmentId}-group-${groupIndex}`;
    socket.join(groupName);


    socket.to(groupName).emit("userJoined", {
      name: User.name,
      groupId: groupName
    });


    socket.emit("userJoined", {
      name: User.name,
      groupId: groupName,
      id: User._id
    });

    console.log(`User ${User.name} joined room ${groupName}`);

    const room = io.sockets.adapter.rooms.get(groupName);
    if (room) {
      console.log("Users in room:", Array.from(room));
    } else {
      console.log("Room is empty or does not exist");
    }
  });

  socket.on("sendMessage", ({ SocketGroup, User, message, PartialSub }) => {

    io.to(SocketGroup).emit("receiveMessage", User, message, PartialSub);
  });

  socket.on("Typing", (SocketGroup, User, Flag) => {

    socket.to(SocketGroup).emit("userTyping", User, Flag);
  });

  socket.on("TypingFinish", (SocketGroup, User) => {

    socket.to(SocketGroup).emit("userTyping", User, false);
  });

  socket.on("Answering", (User, SocketGroup, currentIndex, answer, Flag) => {
    socket.to(SocketGroup).emit("Answering", User, currentIndex, answer, Flag)
  })

  socket.on("Save", async (SocketGroup, User, currentIndex, AssingmentId, PartialSubmission) => {
    console.log("AssingmentId", AssingmentId);
    console.log("PartialSubmission", PartialSubmission);
    socket.to(SocketGroup).emit("SaveBy", User, currentIndex)
    const SubmitAssingment = await PartialSubmission_Model.findOne({ assignmentId: AssingmentId, _id: PartialSubmission?._id })
    console.log("SubmitAssingment", SubmitAssingment);

    Object.assign(SubmitAssingment, PartialSubmission);
    SubmitAssingment.save();
  })

  socket.on("Reset", async (SocketGroup, currentIndex, AssingmentId, UpdateSubmission) => {
    socket.to(SocketGroup).emit("Answering", null, currentIndex, "", false)
    const updated = await PartialSubmission_Model.findOneAndUpdate(
      { assignmentId: AssingmentId, _id: UpdateSubmission._id },
      { $set: { Questions: UpdateSubmission.Questions } },
      { new: true }
    );

  })


  socket.on("Votes", async (SocketGroup, User, currentIndex, AssingmentId, UpdateSubmission) => {
    socket.to(SocketGroup).emit("UpdateVotes", User, currentIndex)
    const update = await PartialSubmission_Model.findOneAndUpdate(
      { assignmentId: AssingmentId, _id: UpdateSubmission._id },
      { $set: { Questions: UpdateSubmission.Questions } },
      { new: true }
    )
  })

  socket.on("SubmissionVote", async (SocketGroup, User, AssingmentId, UpdateSubmission) => {

    if ((UpdateSubmission.SubmissionVote).length >= 2) {
      socket.to(SocketGroup).emit("UpdateSubmissionVote", User, true)
      socket.emit("UpdateSubmissionVote", User, true)
      await PartialSubmission_Model.findOneAndUpdate(
        { assignmentId: AssingmentId, _id: UpdateSubmission._id },
        {
          $set: {
            SubmissionVote: UpdateSubmission.SubmissionVote,
            status: "submitted"
          }
        },
        { new: true }
      )
    }
    else {
      socket.to(SocketGroup).emit("UpdateSubmissionVote", User, false)
      socket.emit("UpdateSubmissionVote", User, false)
      await PartialSubmission_Model.findOneAndUpdate(
        { assignmentId: AssingmentId, _id: UpdateSubmission._id },
        { $set: { SubmissionVote: UpdateSubmission.SubmissionVote } },
        { new: true }
      )
    }
  })

  socket.on("ResetVotes", (SocketGroup) => {
    socket.to(SocketGroup).emit("ResetVotesArray")
    socket.emit("ResetVotesArray")
  })



  socket.on("disconnect", () => {
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }
    io.emit("updateOnlineStatus", Object.keys(onlineUsers));
  });
});




















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

app.use('/uploadPartial', express.static(path.join(__dirname, 'uploadPartial'),
  {
    setHeaders: (res, path) => {
      res.set("Access-Control-Allow-Origin", "http://localhost:5173")
    }
  }
));

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
  app.use("/Assign", AssingmentRoutes)
  app.use("/Partial", PartialAssingment)
  app.use("/Notifications", NotificationRoutes)

  server.listen(port, () => {
    console.log(`App Listening at Port ${port}`);
  });





