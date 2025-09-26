import { Router } from "express";
import {
  addStudentToCourse,
  createCourse,
  getCourse,
  joinCourse,
  listCourses,
  listStudents,
} from "../controllers/courseController.js";

const courseRouter = Router();

courseRouter.post("/", createCourse);
courseRouter.get("/", listCourses);
courseRouter.get("/students", listStudents);
courseRouter.get("/:courseId", getCourse);
courseRouter.post("/:courseId/add-student", addStudentToCourse);
courseRouter.post("/:courseId/join", joinCourse);

export { courseRouter };
