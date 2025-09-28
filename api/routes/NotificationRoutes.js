const express = require("express");
const routes = express.Router();
const { Protect } = require("../utils/Token");
const Notification = require("../models/NotificationModel");


routes.get("/", Protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

routes.put("/:id/read", Protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

module.exports = routes;
