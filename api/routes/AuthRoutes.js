
import express from "express";
import User from "../models/user.model.js"
import bcrypt from "bcryptjs";
import { GenerateToken, VerifyToken, Protect } from "../utils/Token.js";
import upload from "../Middleware/uploadMiddleware.js";

const router = express.Router();




router.post("/register", async (req, res) => {
    try {
        const { name, email, password, profileImageUrl } = req.body;
        console.log(req.body);



        const userexit = await User.findOne({ email });
        if (userexit) {
            return res.status(400).json({ Message: "Email already Registered..." })
        }
        const role = "member"
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        const user = await User.create(
            {
                name,
                email,
                password: hashPassword,
                profileImage: profileImageUrl,
                role: role
            }
        )
        console.log(user);

        if (user) {
            return res.status(201).json({ Message: "User Added Successfully", User: user });
        } else {
            return res.status(500).json({ Message: "User creation failed" });
        }

    } catch (error) {
        console.log(error);

        res.status(404).json({ error: error })
    }


});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const checkUser = await User.findOne({ email });
        if (!checkUser) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }


        const isMatch = await bcrypt.compare(password, checkUser.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        const payload = { User: checkUser };
        const token = GenerateToken(payload);
        console.log(token);

        res.cookie("FreashToken", token, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
            maxAge: 24 * 60 * 60 * 1000
        });
        return res.status(200).json({
            message: "Authorized",
            user: checkUser,
            token: token
        });


    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post('/ForgetPassword', async (req, res) => {
    try {
        const { email } = req.body;
        const users = await User.find({ email });

        if (users.length === 0) {
            return res.status(404).json({ message: "Email is not registered" });
        }

        console.log(users);

        return res.status(200).json({ message: "Email exists", user: users[0] });

    } catch (error) {
        console.error("Error in /ForgetPassword:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});


router.get("/profile", Protect, async (req, res) => {
    try {
        const UserProfile = await User.findById(req.user._id).select("-password");
        if (!UserProfile) {
            res.status(404).json({ message: "User Not Found" })
        }
        console.log(UserProfile);

        res.json({ user: UserProfile });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

router.post("/profile", () => { });


router.post("/uploadImg", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No File is Uploaded" })
    }
    const ImageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    return res.status(200).json({ message: "Image uploaded successfully", Image: ImageUrl });

})

export default router