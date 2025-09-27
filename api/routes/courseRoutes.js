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

const courseRouter = express.Router();

// Specific routes should come before parameterized routes
courseRouter.post("/", createCourse);
courseRouter.get("/", listCourses);
courseRouter.get("/students", listStudents);
courseRouter.post("/upload", upload.single("file"), getResources);
courseRouter.get("/instructor/:instructorId", listCoursesByInstructor);
courseRouter.post("/add-student/:courseId", addStudentToCourse);
courseRouter.post("/join/:courseId", joinCourse);
courseRouter.get("/:courseId", getCourse);


module.exports = { courseRouter };
