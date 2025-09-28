const express = require("express");
const {
  addStudentToCourse,
  createCourse,
  getCourse,
  joinCourse,
  listCourses,
  listStudents,
  listCoursesByInstructor,
} = require("../controllers/courseController");
const { getResources, upload } = require("./resource/rec");
const { Protect } = require("../utils/Token")

const courseRouter = express.Router();

// Specific routes should come before parameter
// ized routes
courseRouter.post("/", createCourse);
courseRouter.get("/", listCourses);
courseRouter.get("/students", listStudents);
courseRouter.post("/upload", upload.single("file"), getResources);
courseRouter.get("/instructor/", Protect, listCoursesByInstructor);
courseRouter.post("/add-student/:courseId", addStudentToCourse);
courseRouter.post("/join/:courseId", joinCourse);
courseRouter.get("/:courseId", getCourse);


module.exports = { courseRouter };
