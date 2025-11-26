const express = require("express");
const {
  addStudentToCourse,
  createCourse,
  getCourse,
  joinCourse,
  listCourses,
  listStudents,
  listCoursesByInstructor,
  setCourseLiveTrue,
  setCourseLiveFalse,
} = require("../controllers/courseController");
const { getResources, upload } = require("./resource/rec");
const { Protect } = require("../utils/Token");
const { getQueries } = require("./queries/query");
const { handleDedupe } = require("./queries/questionsController");

const courseRouter = express.Router();

// Specific routes should come before parameter
// ized routes
courseRouter.post("/", createCourse);
courseRouter.get("/", listCourses);
courseRouter.get("/students", listStudents);
courseRouter.post("/upload", upload.single("file"), getResources);
// courseRouter.post("/cluster", getQueries);
courseRouter.post("/cluster", handleDedupe);
courseRouter.get("/instructor", Protect, listCoursesByInstructor);
courseRouter.post("/add-student/:courseId", addStudentToCourse);
courseRouter.post("/join/:courseId", joinCourse);
courseRouter.post("/:courseId/live/start", setCourseLiveTrue);
courseRouter.post("/:courseId/live/stop", setCourseLiveFalse);
courseRouter.get("/:courseId", getCourse);

module.exports = { courseRouter };
