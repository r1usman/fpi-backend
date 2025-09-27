import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    instructor: { type: String, required: true, trim: true },
    instructorId: { type: Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true, trim: true },
    studentIds: [{ type: Types.ObjectId, ref: "User" }],
    image: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Course = model("Course", courseSchema);

[
  {
    title: "React Development Fundamentals",
    instructorId: "68d232b406ad655f852f404c",
    description:
      "Learn the fundamentals of React development including components, hooks, and state management.",
    image:
      "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    title: "Advanced JavaScript Patterns",
    instructorId: "68d232b406ad655f852f404c",
    description:
      "Master advanced JavaScript concepts including design patterns, async programming, and performance optimization.",
    image:
      "https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    title: "UI/UX Design Principles",
    instructorId: "68d232b406ad655f852f404c",
    description:
      "Understand the core principles of user interface and user experience design for modern applications.",
    image:
      "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    title: "Node.js Backend Development",
    instructorId: "68d232b406ad655f852f404c",
    description:
      "Build robust backend applications using Node.js, Express, and modern database technologies.",
    image:
      "https://images.pexels.com/photos/1181472/pexels-photo-1181472.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    title: "Python Data Science",
    instructorId: "68d232b406ad655f852f404c",
    description:
      "Dive into data science with Python, covering pandas, numpy, matplotlib, and machine learning basics.",
    image:
      "https://images.pexels.com/photos/374016/pexels-photo-374016.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    title: "Mobile App Development with Flutter",
    instructorId: "68d232b406ad655f852f404c",
    description:
      "Create beautiful cross-platform mobile applications using Flutter and Dart programming language.",
    image:
      "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];
