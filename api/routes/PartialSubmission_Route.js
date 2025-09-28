const express = require("express");
const { Protect } = require("../utils/Token");
const PartialSubmission = require("../models/PartialSubmission_Model");
const PartialSubmission_Model = require("../models/PartialSubmission_Model");
const AssingmentModel = require("../models/Assingment_Model");
const { uploadPartial } = require("../Middleware/PartialUploads");
const route = express.Router();
const path = require("path");
const fs = require("fs");
route.post("/Create", Protect, async (req, res) => {
    try {
        const { AssingmentId, Questions, userGroup } = req.body;


        const existing = await PartialSubmission.findOne({
            assignmentId: AssingmentId,
            "Students._id": req.user._id,
            feedback: "",
            SubmissionVote: null,
            thumbnail: "",
            messages: [],
        });

        if (existing) {
            return res.status(200).json(existing);
        }

        const submission = await PartialSubmission.create({
            assignmentId: AssingmentId,
            Questions: Questions,
            Students: [...userGroup],
        });

        res.status(201).json(submission);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

route.get("/Save/:id", Protect, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await PartialSubmission_Model.findOne({
            assignmentId: id,
            Students: { $elemMatch: { _id: req.user._id } }
        })
            .populate("Questions.lockedby")
            .select("-messages");

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



route.put("/Update/:id", Protect, async (req, res) => {
    try {
        const Data = req.body;
        const result = await PartialSubmission_Model.find({
            assignmentId: req.params.id,
            _id: Data._id
        })
        console.log(result);

        res.send(result)

    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})




route.get("/Info", Protect, async (req, res) => {
    try {
        const { assignmentId } = req.body;

        const result = await PartialSubmission_Model.find({
            assignmentId: assignmentId,
        });

        if (!result || result.length === 0) {
            return res.status(404).json({ message: "No submission found" });
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


route.get("/SubmitAssingments", async (req, res) => {
    try {
        const result = await AssingmentModel.find({ dueDate: { $lte: Date.now() } }).sort({ dueDate: 1 })
        if (!result || result.length === 0) {
            return res.status(404).json({ message: "No submission found" });
        }


        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

route.get("/SubmitAssingment/:id", async (req, res) => {
    try {
        const result = await PartialSubmission_Model.find({ assignmentId: req.params.id });
        if (!result || result.length === 0) {
            return res.status(404).json({ message: "No submission found" });
        }
        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})


route.get("/SubmissionDetail/:id", Protect, async (req, res) => {
    try {
        const result = await PartialSubmission.findOne({ _id: req.params.id })
        if (!result)
            return res.status(404).json({ message: "No submission found" });

        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})


route.put("/SaveEvaluation/:id", async (req, res) => {
    try {
        const { PartialSubmission } = req.body
        console.log("PartialSubmission", PartialSubmission);

        const EvaluateAllAnswer = PartialSubmission.Questions.every((item) => item.obtainedMarks != "")
        console.log(EvaluateAllAnswer);

        if (!EvaluateAllAnswer) {
            await PartialSubmission_Model.findOneAndUpdate(
                { _id: PartialSubmission._id },
                {
                    $set: {
                        Questions: PartialSubmission.Questions,
                    }
                },
                { new: true }
            )
        }
        else {
            const TotalMarks = PartialSubmission.Questions.reduce(
                (sum, item) => sum + (Number(item.marks) || 0),
                0
            );

            const Obtained = PartialSubmission.Questions.reduce(
                (sum, item) => sum + (Number(item.obtainedMarks) || 0),
                0
            );
            console.log(TotalMarks, "", Obtained);
            let isPassed = false

            if ((Obtained / TotalMarks) * 100 > 50) {
                isPassed = true
            }

            await PartialSubmission_Model.findOneAndUpdate(
                { _id: PartialSubmission._id },
                {
                    $set: {
                        Questions: PartialSubmission.Questions,
                        obtainedMarks: Obtained,
                        isPassed: isPassed,
                        status: "graded"
                    }
                },
                { new: true }
            )



        }



        res.send(EvaluateAllAnswer)


    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})


route.put("/SaveThumbnail/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { thumbnail } = req.body;

        if (!thumbnail) {
            return res.status(400).json({ error: "Thumbnail URL is required" });
        }

        const response = await PartialSubmission_Model.findOneAndUpdate(
            { _id: id },
            { $set: { thumbnail } },
            { new: true }
        );

        if (!response) {
            return res.status(404).json({ error: "Partial submission not found" });
        }

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save thumbnail" });
    }
});


route.put("/:id/upload-image", (req, res) => {
    try {
        uploadPartial.fields([{ name: 'thumbnail' },])(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: "File upload failed", error: err.message });
            }

            const PartialAssingmentID = req.params.id;
            const PartialAssingment = await PartialSubmission_Model.findOne({ _id: PartialAssingmentID });



            if (!PartialAssingment) {
                return res.status(404).json({ message: "PartialAssingment not found or unauthorized" });
            }

            const uploadsFolder = path.join(__dirname, '..', 'uploadPartial');
            const baseUrl = `${req.protocol}://${req.get("host")}`;

            const newThumbnail = req.files.thumbnail?.[0];


            if (newThumbnail) {
                if (PartialAssingment.thumbnail) {
                    const oldThumbnail = path.join(uploadsFolder, path.basename(PartialAssingment.thumbnail));
                    if (fs.existsSync(oldThumbnail)) fs.unlinkSync(oldThumbnail);
                }
                PartialAssingment.thumbnail = `${baseUrl}/uploadPartial/${newThumbnail.filename}`;
            }


            await PartialAssingment.save();
            res.status(200).json({
                Message: "Images uploaded Successfully",
                thumbnail: PartialAssingment.thumbnail,
            })
        });
    } catch (error) {
        console.error("Error in uploadResumeImages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

route.put("/SaveMessage/:id", Protect, async (req, res) => {
    try {
        const ID = req.params.id;
        const { messages } = req.body;
        const response = await PartialSubmission_Model.findOneAndUpdate(
            { _id: ID },
            { $set: { messages: messages } },
            { new: true }
        );
        res.send(response)

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})


route.get("/SaveMessage/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;

        const partial = await PartialSubmission.findById(id);

        if (!partial) {
            return res.status(404).json({ error: "PartialSubmission not found" });
        }
        const totalMessages = partial.messages.length;

        const messages = [...partial.messages]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice((page - 1) * limit, page * limit)
            .reverse();

        res.json({
            messages,
            totalMessages,
            hasMore: page * limit < totalMessages,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = route;
