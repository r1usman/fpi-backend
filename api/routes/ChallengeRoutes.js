const express = require("express");
const route = express.Router();
const { Protect } = require("../utils/Token")
const Challenge_Model = require("../models/Challenge_Model");
const upload = require("../Middleware/uploadMiddleware");
const path = require("path")
const fs = require("fs");
const Submission = require("../models/Submission");
const { Course } = require("../models/Course.js");
const Notification = require("../models/NotificationModel");
route.post("/Create", Protect, async (req, res) => {
    try {

        const status = req.user.status;
        if (status == "Student")
            return res.status(401).json({ message: "Students are not Allowed to Create a Challenge" })
        const { title } = req.body;
        const DefaultChallenge = {
            description: "Null",
            functionSignature: "",
            ChallengeFor: "",
            difficulty: "Easy",
            language: [""],
            startTime: "",
            endTime: "",
            duration: "",
            SubmittedBy: [""],
            defaultBoilercode: {
                language: "",
                inputType: "",
                outputType: ""
            },
            tags: "",
            attempt: false,
            isPublic: false,
            Question: "",
            thumbnailLink: "",
            testCases: [
                {
                    input: null,
                    expectedOutput: "",
                }
            ],
            examples: [
                {
                    ExampleURl: "",
                    input: "",
                    output: ""
                }
            ]
        }
        const ChallengeCreated = await Challenge_Model.create({
            title,
            UserID: req.user._id,
            ...DefaultChallenge
        })

        res.send(ChallengeCreated)

    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }

})


route.get("/GetAll", Protect, async (req, res) => {
    try {
        const status = req.user.status;
        if (status == "Student")
            return res.status(401).json({ message: "Student are Not Allowed" })

        const NumberOfChallengeCreated = await Challenge_Model.find({ UserID: req.user._id })
        if (!NumberOfChallengeCreated)
            return res.send("Looks like no challenges have been created yet!")
        res.send(NumberOfChallengeCreated)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
})

route.get("/GetDashboard", Protect, async (req, res) => {
    try {
        const status = req.user.status;
        if (status == "Student")
            return res.status(401).json({ message: "Student are Not Allowed" })

        const NumberOfChallengeCreated = await Challenge_Model.find({ UserID: req.user._id }).limit(3).sort({ createdAt: -1 })
        if (!NumberOfChallengeCreated)
            return res.send("Looks like no challenges have been created yet!")
        res.send(NumberOfChallengeCreated)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
})

route.get("/GetAllWithPublic", Protect, async (req, res) => {
    try {
        const status = req.user.status;
        const CourseData = await Course
        console.log(status);

        if (status == "Instrutor")
            return res.status(401).json({ message: "Instrutor are Not Allowed" })

        const NumberOfChallengeCreated = await Challenge_Model.find({ isPublic: true, SubmittedBy: { $ne: req.user._id } })
        if (!NumberOfChallengeCreated)
            return res.send("Looks like no challenges have been created yet!")
        res.send(NumberOfChallengeCreated)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
})
route.get("/GetAll/:id", Protect, async (req, res) => {
    try {
        const ChallengeID = req.params.id;
        const status = req.user.status;
        // if (status == "Student")
        //     return res.status(401).json({ message: "Student are Not Allowed" })

        const NumberOfChallengeCreated = await Challenge_Model.findOne({ _id: ChallengeID })
        if (!NumberOfChallengeCreated)
            return res.send("The challenge ID you are looking for does not exist.")
        res.send(NumberOfChallengeCreated)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
})

route.put("/Update/:id", Protect, async (req, res) => {
    try {
        const status = req.user.status;
        if (status == "Student")
            return res.status(401).json({ message: "Student are Not Allowed" });

        const id = req.params.id;

        const Challenge = await Challenge_Model.findById(id);
        if (!Challenge)
            return res.status(404).send("The challenge ID you are looking for does not exist.");

        Object.assign(Challenge, req.body);
        const savedChallenge = await Challenge.save();

        const courseId = savedChallenge.ChallengeFor;
        const course = await Course.findById(courseId);
        if (!course)
            return res.status(404).json({ message: "Course not found for this challenge" });

        const studentIds = course.studentIds;
        console.log("studentIds", studentIds);

        if (savedChallenge.isPublic) {
            const formattedDate = new Date(savedChallenge.startTime).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });

            await Notification.insertMany(
                studentIds.map((studentId) => ({
                    userId: studentId,
                    title: `New Challenge Update`,
                    message: `A course challenge has been updated and will start on ${formattedDate}. Please check your dashboard for details.`,
                    challengeId: savedChallenge._id,
                    courseId: course._id,
                    read: false,
                    createdAt: new Date()
                }))
            );
        }



        res.send({
            message: "Challenge updated & notifications sent",
            challenge: savedChallenge,
        });
    } catch (error) {
        res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
});


route.get("/GetLeaderBoardData", async (req, res) => {
    try {
        const data = await Challenge_Model.find({ endTime: { $lte: new Date() } })
        res.send(data);
    } catch (error) {
        console.log(error);

    }
})

route.delete("/Delete/:id", Protect, async (req, res) => {
    try {
        const id = req.params.id;
        const status = req.user.status;
        if (status == "Student")
            return res.status(401).json({ message: "Students are not Allowed to Delete the Challenge" })
        const DeleteChallenge = await Challenge_Model.findByIdAndDelete({ _id: id });
        if (DeleteChallenge)
            return res.send("Challenge Deleted")
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }

})

route.delete("/DeleteList", Protect, async (req, res) => {
    try {
        const { DeletedArray } = req.body;
        const status = req.user.status;

        if (status === "Student") {
            return res.status(401).json({
                message: "Students are not allowed to delete challenges"
            });
        }

        // Delete all in parallel
        // const deleteResults = await Promise.all(
        //     DeletedArray.map(id => Challenge_Model.findByIdAndDelete(id))
        // );
        for (const id of DeletedArray) {
            await Challenge_Model.findByIdAndDelete(id);
        }

        res.json({
            message: "Challenges deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
});




route.put("/:id/upload-image", (req, res) => {
    try {
        upload.fields([{ name: 'thumbnail' }, { name: 'profileImage' }])(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: "File upload failed", error: err.message });
            }

            const ChallengeID = req.params.id;
            const Challenge = await Challenge_Model.findOne({ _id: ChallengeID });
            console.log(Challenge);


            if (!Challenge) {
                return res.status(404).json({ message: "Challenge not found or unauthorized" });
            }

            const uploadsFolder = path.join(__dirname, '..', 'upload');
            console.log("uploadsFolder", uploadsFolder);

            const baseUrl = `${req.protocol}://${req.get("host")}`;

            const newThumbnail = req.files.thumbnail?.[0];
            // const newProfileImage = req.files.profileImage?.[0];


            // console.log("newProfileImage", newProfileImage);

            if (newThumbnail) {
                console.log("resume.thumbnaillink", Challenge.thumbnailLink);
                if (Challenge.thumbnailLink) {
                    const oldThumbnail = path.join(uploadsFolder, path.basename(Challenge.thumbnailLink));
                    if (fs.existsSync(oldThumbnail)) fs.unlinkSync(oldThumbnail);
                }
                Challenge.thumbnailLink = `${baseUrl}/uploads/${newThumbnail.filename}`;
            }

            // If new profile image uploaded, delete old one
            // if (newProfileImage && resume.profileInfo?.profilePreviewUrl) { // Original commented line
            // if (newProfileImage) {
            //     console.log("resume.profileInfo?.profilePreviewUrl", resume.profileInfo?.profilePreviewUrl);

            //     if (resume.profileInfo?.profilePreviewUrl) {
            //         const oldProfile = path.join(uploadsFolder, path.basename(resume.profileInfo.profilePreviewUrl));
            //         if (fs.existsSync(oldProfile)) fs.unlinkSync(oldProfile);
            //     }
            //     resume.profileInfo.profilePreviewUrl = `${baseUrl}/uploads/${newProfileImage.filename}`;
            // }
            // console.log("profilePreviewUrl: resume.profilePreviewUrl", resume.profilePreviewUrl);

            await Challenge.save();
            res.status(200).json({
                Message: "Images uploaded Successfully",
                thumbnaillink: Challenge.thumbnailLink,
            })
        });
    } catch (error) {
        console.error("Error in uploadResumeImages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})


route.get("/ak", Protect, async (req, res) => {
    try {
        const instructorId = req.user._id;

        const challenges = await Challenge_Model.find({ UserID: instructorId });

        const totalChallenges = challenges.length;

        const studentSet = new Set();

        const submissionsMap = {};

        const difficultyCount = { Easy: 0, Medium: 0, Hard: 0 };

        console.log(challenges);

        challenges.forEach(ch => {
            if (Array.isArray(ch.SubmittedBy)) {
                ch.SubmittedBy.forEach(s => {
                    if (s && s.toString().trim() !== "") {
                        studentSet.add(s.toString());
                        const date = new Date(ch.createdAt).toISOString().slice(0, 10);
                        submissionsMap[date] = (submissionsMap[date] || 0) + 1;
                    }
                });

            }
            const level = ch.difficulty;
            if (level && difficultyCount[level] !== undefined) {
                difficultyCount[level]++;
            }
        });

        const activeStudents = studentSet.size;

        const submissionsPerDay = Object.keys(submissionsMap)
            .sort()
            .map(date => ({ date, count: submissionsMap[date] }));

        res.json({
            totalChallenges,
            activeStudents,
            submissionsPerDay,
            problemsByDifficulty: difficultyCount
        });

    } catch (error) {
        console.error("Error fetching instructor KPIs:", error);
        res.status(500).json({ message: "Server error while fetching dashboard data" });
    }
});




module.exports = route