const express = require("express")

const route = express.Router();
const BlogPost = require("../models/Blog_Schema")


route.post("/create", async (req, res) => {
    try {
        const { title, content, coverImageUrl, tags, isDraft, generatedByAI, BelongTo } = req.body;
        const slug = title
            .toLowerCase()
            .replace(/ /g, "-")
            .replace(/[^\w-]+/g, "");
        const newPost = new BlogPost({
            title,
            slug,
            content,
            coverImageUrl,
            tags,
            BelongTo,
            isDraft,
            generatedByAI,
        });

        await newPost.save();

        res.status(201).json({
            message: "Post created successfully!",
            post: newPost,
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to create post",
            error: err.message,
        });
    }
});


const router = express.Router();

route.put("/update/:id", async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }


        const updatedData = req.body;

        if (updatedData.title) {
            updatedData.slug = updatedData.title
                .toLowerCase()
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "");
        }

        const updatedPost = await BlogPost.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true }
        );

        res.json({
            message: "Post updated successfully!",
            updatedPost,
        });
    } catch (err) {
        res.status(500).json({
            message: "Server Error",
            error: err.message,
        });
    }
});


route.delete("/delete/:id", async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        await post.deleteOne();

        res.json({ message: "Post deleted successfully!" });
    } catch (err) {
        res.status(500).json({
            message: "Server Error",
            error: err.message,
        });
    }
});


route.get("/CourseBlogs/:id", async (req, res) => {
    try {
        const CourseId = req.params.id;
        const posts = await BlogPost.find({ BelongTo: CourseId });

        if (posts.length === 0) {
            return res.status(404).json({ message: "Post not found" });
        }

        const totalViews = posts.reduce((acc, curr) => acc + curr.views, 0);
        const totalLikes = posts.reduce((acc, curr) => acc + curr.likes, 0);

        res.json({
            totalViews,
            totalLikes,
            posts
        });
    } catch (err) {
        res.status(500).json({
            message: "Server Error",
            error: err.message,
        });
    }
});



route.get("/posts", async (req, res) => {
    try {
        const status = req.query.status || "published";
        console.log(status);

        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        const skip = (page - 1) * limit;

        let filter = {};
        if (status === "published") filter.isDraft = false;
        else if (status === "draft") filter.isDraft = true;
        console.log(filter);


        const posts = await BlogPost.find(
            status === "Draft" ? { isDraft: true } : { isDraft: false }
        )
            .populate("BelongTo")
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);



        const [totalCount, allCount, publishedCount, draftCount] = await Promise.all([
            BlogPost.countDocuments(filter),
            BlogPost.countDocuments(),
            BlogPost.countDocuments({ isDraft: false }),
            BlogPost.countDocuments({ isDraft: true }),
        ]);

        res.json({
            posts,
            page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            counts: {
                all: allCount,
                published: publishedCount,
                draft: draftCount,
            },
        });
    } catch (err) {
        res.status(500).json({
            message: "Server Error",
            error: err.message,
        });
    }
});

route.get("/slug/:slug", async (req, res) => {
    try {
        const post = await BlogPost.findOne({ slug: req.params.slug })

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        res.json(post);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});


router.get("/tag/:tag", async (req, res) => {
    try {
        const posts = await BlogPost.find({
            tags: req.params.tag,
            isDraft: false,
        }).populate("name profileImageUrl");

        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});


router.get("/search", async (req, res) => {
    try {
        const q = req.query.q;

        const posts = await BlogPost.find({
            isDraft: false,
            $or: [
                { title: { $regex: q, $options: "i" } },
                { content: { $regex: q, $options: "i" } },
            ],
        }).populate("name profileImageUrl");

        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

router.put("/increment-view/:id", async (req, res) => {
    try {
        await BlogPost.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.json({ message: "View count incremented" });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});


router.put("/like/:id", async (req, res) => {
    try {
        await BlogPost.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } });
        res.json({ message: "Like added" });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});


module.exports = route; 