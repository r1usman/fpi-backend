const express = require("express");
const { Protect } = require("../utils/Token");
const Assingment_Model = require("../models/Assingment_Model");
const Notification = require("../models/NotificationModel");
const User_Model = require("../models/user.model");
const PartialSubmission_Model = require("../models/PartialSubmission_Model");
const upload = require("../Middleware/uploadMiddleware");
const route = express.Router();
const path = require("path");
const fs = require("fs");
route.post("/Create", Protect, async (req, res) => {
    try {
        const { title } = req.body
        const DefaultAssingment = {
            description: "",
            dueDate: "",
            totalMarks: 0,
            thumbnail: "",
            questions: [
                {
                    questionText: "",
                    options: [""],
                    marks: "",
                    answer: "",
                    StudentAnswer: ""
                }
            ],
            sections: [
                {
                    title: "",
                    description: "",
                    questions: [
                        {
                            questionText: "",
                            options: [""],
                            marks: ""
                        }
                    ]
                }
            ],
            settings: {
                groupSettings: {
                    numberOfGroups: 0,
                    studentsPerGroup: 0,
                },
                allowLateSubmission: false,
            },
        }

        const Assinment = await Assingment_Model.create({
            title: title,
            Instructor: req.user._id,
            ...DefaultAssingment
        })
        res.send(Assinment)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

route.put("/Update/:id", Protect, async (req, res) => {
    try {
        const status = req.user.status;
        if (status === "Student")
            return res.status(401).json({ message: "Students are not allowed" });

        const id = req.params.id;



        const assignment = await Assingment_Model.findById(id);
        if (!assignment)
            return res.status(404).json({ message: "Assignment not found" });


        Object.assign(assignment, req.body);
        const savedAssignment = await assignment.save();
        console.log(savedAssignment);



        if (savedAssignment.settings?.visibility === "public") {
            const studentIds = savedAssignment.settings?.groupSettings?.groupsDetail?.flat();

            if (studentIds && studentIds.length > 0) {
                const notifications = studentIds.map(studentId => ({
                    userId: studentId,
                    title: "New Assignment Available",
                    message: `Assignment "${savedAssignment.title}" has been made public.`,
                    type: "Assignment",
                }));

                await Notification.insertMany(notifications);
            }
        }


        res.send(savedAssignment);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

route.get("/Assingments", Protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        console.log(page, limit);

        const total = await Assingment_Model.countDocuments({
            Instructor: req?.user?._id,
        });
        console.log("req?.user?._id,", req?.user?._id,);


        const assingments = await Assingment_Model.find({
            Instructor: req?.user?._id,
        })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });


        res.json({
            page,
            limit,
            totalItems: total,
            totalPages: Math.ceil(total / limit),
            data: assingments,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

route.get("/Assingments/:id", Protect, async (req, res) => {
    try {
        const Assingments = await Assingment_Model.findOne({
            _id: req.params.id
        }).populate("Instructor")
        res.send(Assingments)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})


route.get("/Students", Protect, async (req, res) => {
    try {

        const data = await User_Model.findOne({ email: "A@gmail.com" })
            .populate({ path: "students", select: "-password -students -createdAt -updatedAt -email" })
            .select("-password");
        res.status(200).json({ Students: data.students })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }

})

route.get("/student", Protect, async (req, res) => {
    try {

        const assignments = await Assingment_Model.find({
            "settings.groupSettings.groupsDetail": {
                $elemMatch: {
                    $elemMatch: { _id: req.user._id }
                }
            },
            "settings.visibility": "public",
            dueDate: { $gte: new Date() }
        });

        if (!assignments || assignments.length === 0) {
            return res.status(404).json({ message: "No assignments found for this student" });
        }

        const assignmentIds = assignments.map(a => a._id.toString());
        const submittedSubmissions = await PartialSubmission_Model.find({
            assignmentId: { $in: assignmentIds },
            Students: { $elemMatch: { _id: req.user._id } },
            status: { $in: ["submitted", "graded"] }
        });



        const submittedIds = submittedSubmissions.map(ps => ps.assignmentId.toString());


        const validAssignmentIds = assignmentIds.filter((id) => !submittedIds.includes(id));


        const partialSubmissions = await PartialSubmission_Model.find({
            assignmentId: { $in: validAssignmentIds },
            Students: { $elemMatch: { _id: req.user._id } },
            status: { $ne: "submitted" }
        });

        const result = validAssignmentIds.map(id => {
            const assignment = assignments.find(a => a._id.toString() === id);
            const partial = partialSubmissions.find(ps => ps.assignmentId.toString() === id);

            return {
                assignment,
                partial
            };
        });
        const DisplayAssingment = result.map((item) => item.assignment)
        res.json(DisplayAssingment);


    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

route.put("/:id/upload-image", (req, res) => {
    try {
        upload.fields([{ name: 'thumbnail' },])(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: "File upload failed", error: err.message });
            }

            const AssingmentId = req.params.id;
            const Assignment = await Assingment_Model.findOne({ _id: AssingmentId });
            console.log(Assignment);


            if (!Assignment) {
                return res.status(404).json({ message: "Assignment not found or unauthorized" });
            }

            const uploadsFolder = path.join(__dirname, '..', 'upload');
            console.log("uploadsFolder", uploadsFolder);

            const baseUrl = `${req.protocol}://${req.get("host")}`;

            const newThumbnail = req.files.thumbnail?.[0];


            if (newThumbnail) {
                if (Assignment.thumbnail) {
                    const oldThumbnail = path.join(uploadsFolder, path.basename(Assignment.thumbnail));
                    if (fs.existsSync(oldThumbnail)) fs.unlinkSync(oldThumbnail);
                }
                Assignment.thumbnail = `${baseUrl}/uploads/${newThumbnail.filename}`;
            }


            await Assignment.save();
            res.status(200).json({
                Message: "Images uploaded Successfully",
                thumbnail: Assignment.thumbnail,
            })
        });
    } catch (error) {
        console.error("Error in uploadResumeImages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})



route.get("/InstructorDetail/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id);

        const result = await User_Model.findById(id);
        if (!result) {
            return res.status(404).json({ message: "Instructor not found" });
        }
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


route.delete("/Assingments/:id", Protect, async (req, res) => {
    try {
        const id = req.params.id;

        const deleted = await Assingment_Model.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }
        res.json({
            success: true,
            message: "Assignment deleted successfully",
            deletedId: id,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
route.get("/Assingments/Count/By-day", Protect, async (req, res) => {
    try {
        const stats = await Assingment_Model.aggregate([
            {
                $match: { Instructor: req.user._id },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});



route.get("/Result/:id", Protect, async (req, res) => {
    try {
        const Id = req.params.id
        console.log();

        const AssingmentResult = await PartialSubmission_Model.findOne(
            {
                assignmentId: Id,
                Students: { $elemMatch: { _id: req.user._id } },


            }
        )
        res.send(AssingmentResult)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})






module.exports = route