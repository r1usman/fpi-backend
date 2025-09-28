const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const NotificationSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ["Assignment", "Message", "System"],
            default: "System"
        },
        read: {
            type: Boolean,
            default: false
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
