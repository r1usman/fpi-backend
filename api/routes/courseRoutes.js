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

const courseRouter = express.Router();

courseRouter.post("/", createCourse);
courseRouter.get("/", listCourses);
courseRouter.get("/students", listStudents);
courseRouter.get("/:instructorId", listCoursesByInstructor);
courseRouter.get("/:courseId", getCourse);
courseRouter.post("/:courseId/add-student", addStudentToCourse);
courseRouter.post("/:courseId/join", joinCourse);

module.exports = { courseRouter };
