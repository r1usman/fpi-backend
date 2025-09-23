import mongoose from "mongoose";

const UserScheme = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: null },

    status: {
        type: String,
        required: true,
        enum: ['Admin', "Student", "Instructor"],
        default: "Student"
    },

    submissions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SingleSubmission'
        }
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserScheme);

export default User;