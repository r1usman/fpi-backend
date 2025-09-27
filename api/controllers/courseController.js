const { Course } = require("../models/Course.js");
const User = require("../models/user.model.js");

async function createCourse(req, res) {
  try {
    const { title, instructorId, description, image } = req.body;
    if (!title || !instructorId || !description || !image) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const instructorDoc = await User.findById(instructorId);
    if (!instructorDoc)
      return res.status(404).json({ error: "Instructor not found" });

    const course = await Course.create({
      title,
      instructorId,
      instructor: instructorDoc.name,
      description,
      image,
      studentIds: [],
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to create course" });
  }
}

async function getCourse(req, res) {
  try {
    const course = await Course.findById(req.params.courseId)
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to get course" });
  }
}

async function listCourses(req, res) {
  try {
    const courses = await Course.find({});
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Failed to list courses" });
  }
}

async function addStudentToCourse(req, res) {
  try {
    const { studentId } = req.body;
    if (!studentId)
      return res
        .status(400)
        .json({ error: "Missing required field: studentId" });

    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    if (!course.studentIds.find((id) => id.toString() === student.id)) {
      course.studentIds.push(student._id);
      await course.save();
    }
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to add student to course" });
  }
}

async function joinCourse(req, res) {
  try {
    console.log(req.body);
    const { studentId } = req.body;
    if (!studentId)
      return res
        .status(400)
        .json({ error: "Missing required field: studentId" });

    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    if (!course.studentIds.find((id) => id.toString() === student.id)) {
      course.studentIds.push(student._id);
      await course.save();
    }
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to join course" });
  }
}

async function listCoursesByInstructor(req, res) {
  try {
    const { instructorId } = req.params;
    const instructor = await User.findById(instructorId);
    if (!instructor)
      return res.status(404).json({ error: "Instructor not found" });

    const courses = await Course.find({ instructorId });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Failed to list courses for instructor" });
  }
}

async function listStudents(req, res) {
  try {
    const students = await User.find({ status: "Student" });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Failed to list students" });
  }
}


module.exports = {
  createCourse,
  getCourse,
  listCourses,
  listCoursesByInstructor,
  addStudentToCourse,
  joinCourse,
  listStudents,
};
