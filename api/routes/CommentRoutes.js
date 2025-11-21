const express = require("express");
const router = express.Router();
const Comment = require("../models/CommentSchema");
const BlogPost = require("../models/Blog_Schema");
const { GenerateToken, VerifyToken, Protect } = require("../utils/Token");

// -----------------------------------------------------
// ADD COMMENT
// POST /api/comments/:postId
// -----------------------------------------------------

router.get("/Dashboard", async (req, res) => {
    try {
        const [
            totalPosts,
            drafts,
            published,
            totalComments,
            aiGenerated,
            scrapContent
        ] = await Promise.all([
            BlogPost.countDocuments(),
            BlogPost.countDocuments({ isDraft: true }),
            BlogPost.countDocuments({ isDraft: false }),
            Comment.countDocuments(),
            BlogPost.countDocuments({ generatedByAI: true }),
            BlogPost.countDocuments({ generatedByAI: false })

        ]);

        // Total views
        const totalViewsAgg = await BlogPost.aggregate([
            { $group: { _id: null, total: { $sum: "$views" } } }
        ]);

        // Total likes
        const totalLikesAgg = await BlogPost.aggregate([
            { $group: { _id: null, total: { $sum: "$likes" } } }
        ]);

        const totalViews = totalViewsAgg[0]?.total || 0;
        const totalLikes = totalLikesAgg[0]?.total || 0;

        // Top performing posts
        const topPosts = await BlogPost.find({ isDraft: false })
            .select("title coverImageUrl views likes")
            .sort({ views: -1, likes: -1 })
            .limit(5);

        // Recent comments
        const recentComments = await Comment.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("author", "name profileImage")
            .populate("post", "title ");

        // Tag usage
        const tagUsage = await BlogPost.aggregate([
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $project: { tag: "$_id", count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ]);

        // Final response
        res.json({
            stats: {
                totalPosts,
                drafts,
                published,
                totalComments,
                aiGenerated,
                scrapContent,
                totalViews,
                totalLikes
            },
            topPosts,
            recentComments,
            tagUsage
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch dashboard summary",
            error: error.message,
        });
    }
});


router.post("/:postId", Protect, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, parentComment } = req.body;

        // Check if blog post exists
        const post = await BlogPost.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const comment = await Comment.create({
            post: postId,
            author: req.user._id,
            content,
            parentComment: parentComment || null,
        });



        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({
            message: "Failed to add comment",
            error: error.message,
        });
    }
});

router.get("/post/:postId", Protect, async (req, res) => {
    try {
        const { postId } = req.params;

        const comments = await Comment.find({ post: postId })
            .populate("author", "name profileImage")
            .populate("post", "title coverImageUrl")
            .sort({ createdAt: 1 });

        const commentMap = {};
        const commentObjects = comments.map((c) => {
            const obj = c.toObject();
            obj.replies = [];
            commentMap[obj._id] = obj;
            return obj;
        });

        const nestedComments = [];

        commentObjects.forEach((comment) => {
            if (comment.parentComment) {
                const parent = commentMap[comment.parentComment];
                if (parent) parent.replies.push(comment);
            } else {
                nestedComments.push(comment);
            }
        });

        res.json(nestedComments);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch comments",
            error: error.message,
        });
    }
});


router.delete("/:commentId", async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });

        // Delete comment
        await Comment.deleteOne({ _id: commentId });

        // Delete replies
        await Comment.deleteMany({ parentComment: commentId });

        res.json({ message: "Comment and its replies deleted successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete comment",
            error: error.message,
        });
    }
});

module.exports = router;
