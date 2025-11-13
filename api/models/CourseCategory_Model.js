const mongoose = require("mongoose");

const { Schema, model, Types } = mongoose;

const CoursesCategory = new Schema(
    {
        title: { type: String, required: true, trim: true, unique: true },
        description: { type: String, trim: true },
        studentIds: [{ type: Types.ObjectId, ref: "User" }],
        image: { type: String, trim: true },
    },
    { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

const DefaultCourse = model("CoursesCategory", CoursesCategory);

module.exports = DefaultCourse;