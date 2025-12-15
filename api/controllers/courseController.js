const { Course } = require("../models/Course.js");
const User = require("../models/user.model.js");
const BlogPost = require("../models/Blog_Schema.js");

async function createCourse(req, res) {
  try {
    const instructorId = req.user._id;
    const { title } = req.body;
    if (!title || !instructorId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const instructorDoc = await User.findById(instructorId);
    if (!instructorDoc)
      return res.status(404).json({ error: "Instructor not found" });
    const course = await Course.create({
      title,
      instructorId,
      instructor: instructorDoc.name,

      studentIds: [],
    });

    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to create course" });
  }
}

async function getCourse(req, res) {
  try {
    const course = await Course.findById(req.params.courseId).populate({
      path: "studentIds",
      select: "name status",
    });
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to get course" });
  }
}

async function listCourses(req, res) {
  try {
    const courses = await Course.aggregate([
      // Join blog posts belonging to this course
      {
        $lookup: {
          from: "blogposts",
          localField: "_id",
          foreignField: "BelongTo",
          as: "posts",
        },
      },
      // Compute totals: views sum and likes (likedBy length) sum
      {
        $addFields: {
          totalViews: { $sum: { $ifNull: ["$posts.views", []] } },
          totalLikes: {
            $sum: {
              $map: {
                input: { $ifNull: ["$posts", []] },
                as: "p",
                in: { $size: { $ifNull: ["$$p.likedBy", []] } },
              },
            },
          },
        },
      },
      // Sort by totalLikes descending
      { $sort: { totalLikes: -1 } },
      // Optionally exclude posts array from output
      {
        $project: {
          posts: 0,
        },
      },
    ]);
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
    const instructor = await User.findById(req.user._id);
    if (!instructor) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    const courses = await Course.find({ instructorId: req.user._id }).populate({
      path: "studentIds",
      select: "name status",
    });
    res.json(courses);
  } catch (err) {
    console.error(err);
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

async function setCourseLiveTrue(req, res) {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (!course.live) {
      course.live = true;
      await course.save();
    }
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to set course live" });
  }
}

async function setCourseLiveFalse(req, res) {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (course.live) {
      course.live = false;
      await course.save();
    }
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to unset course live" });
  }
}

async function listCoursesByStudent(req, res) {
  try {
    const studentId =
      (req.user && req.user._id) || req.params.studentId || req.query.studentId;
    if (!studentId) {
      return res.status(400).json({ error: "Missing studentId" });
    }
    const courses = await Course.find({ studentIds: studentId }).populate({
      path: "studentIds",
      select: "name status",
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Failed to list courses for student" });
  }
}

async function listCoursesNotJoined(req, res) {
  try {
    const studentId =
      (req.user && req.user._id) || req.params.studentId || req.query.studentId;
    if (!studentId) {
      return res.status(400).json({ error: "Missing studentId" });
    }
    const courses = await Course.find({
      studentIds: { $nin: [studentId] },
    });
    res.json(courses);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to list unjoined courses for student" });
  }
}

async function listPopularCourses(req, res) {
  try {
    const agg = await BlogPost.aggregate([
      // Only posts linked to a course
      { $match: { BelongTo: { $ne: null } } },
      // compute likes count per post
      { $addFields: { likesCount: { $size: { $ifNull: ["$likedBy", []] } } } },
      // group by course id
      {
        $group: {
          _id: "$BelongTo",
          totalViews: { $sum: { $ifNull: ["$views", 0] } },
          totalLikes: { $sum: "$likesCount" },
          posts: { $sum: 1 },
        },
      },
      // join course details
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      // compute popularity score (views primary, likes secondary)
      {
        $addFields: {
          popularityScore: {
            $add: ["$totalViews", { $multiply: ["$totalLikes", 10] }],
          },
        },
      },
      // sort by views desc then likes desc
      // { $sort: { totalViews: -1, totalLikes: -1 } },
      { $sort: { totalLikes: -1 } },
      // limit to top 2
      { $limit: 2 },
      // final shape
      {
        $project: {
          _id: 0,
          courseId: "$_id",
          title: "$course.title",
          description: "$course.description",
          instructor: "$course.instructor",
          image: "$course.image",
          totalViews: 1,
          totalLikes: 1,
          posts: 1,
          popularityScore: 1,
        },
      },
    ]);

    return res.json(agg);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch popular courses" });
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
  setCourseLiveTrue,
  setCourseLiveFalse,
  listCoursesByStudent,
  listCoursesNotJoined,
  listPopularCourses,
};
