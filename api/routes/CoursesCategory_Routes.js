const express = require("express");

const route = express.Router();
const DefaultCourseSchemas = require("../models/CourseCategory_Model");
const upload = require("../Middleware/uploadMiddleware");
const path = require("path");
const fs = require("fs");
const { Course: CourseN } = require("../models/Course.js");
route.get("/", (req, res) => {
  res.send("Hello");
});

route.post("/Create", async (req, res) => {
  try {
    const { title } = req.body;

    const isexist = await CourseN.findOne({ title: title });
    if (isexist)
      return res.status(400).json({ message: "Course Already Exist" });

    const DefaultCourse = {
      description: "",
      studentIds: [],
      image: "",
    };

    const Course = await CourseN.create({
      title: title,
      ...DefaultCourse,
    });
    res.send(Course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

route.get("/Course", async (req, res) => {
  try {
    const result = await DefaultCourseSchemas.find();
    res.send(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

route.put("/Update/:id", async (req, res) => {
  try {
    const courseId = req.params.id;
    const Course = await CourseN.findById(courseId);
    if (!Course) return res.status(404).json({ message: "Course not found" });

    Object.assign(Course, req.body);
    const CourseSaved = await Course.save();
    console.log(CourseSaved);

    res.send(CourseSaved);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

route.put("/:id/upload-image", (req, res) => {
  try {
    upload.fields([{ name: "image" }])(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ message: "File upload failed", error: err.message });
      }

      const CourseID = req.params.id;
      console.log(CourseID);
      const courseDoc = await CourseN.findOne({ _id: CourseID });

      if (!courseDoc) {
        return res
          .status(404)
          .json({ message: "Course not found or unauthorized" });
      }

      const uploadsFolder = path.join(__dirname, "..", "uploads");
      console.log("uploadsFolder", uploadsFolder);

      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const newThumbnail = req.files.image?.[0];
      console.log("newThumbnail", newThumbnail);

      if (newThumbnail) {
        if (courseDoc.image) {
          const oldThumbnail = path.join(
            uploadsFolder,
            path.basename(courseDoc.image)
          );
          if (fs.existsSync(oldThumbnail)) fs.unlinkSync(oldThumbnail);
        }
        courseDoc.image = `${baseUrl}/uploads/${newThumbnail.filename}`;
      }

      await courseDoc.save();

      console.log(courseDoc);

      res.status(200).json({
        Message: "Images uploaded Successfully",
        image: courseDoc.image,
      });
    });
  } catch (error) {
    console.error("Error in uploadCourseImages:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = route;
