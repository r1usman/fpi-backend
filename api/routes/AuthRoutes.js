
import express from "express";
import User from "../models/user.model.js"
import bcrypt from "bcryptjs";
import { GenerateToken, VerifyToken, Protect } from "../utils/Token.js";
import upload from "../Middleware/uploadMiddleware.js";
import { transporter, SendMail } from "../utils/Mail.js"
import otpGenerator from "otp-generator"
import { GeneratePassRecoveryToken, PassRecoveryMiddleware, VerifyPassRecoveryToken } from "../utils/PasswordResetToken.js"
import { MailTemplateOTP } from "../utils/MailTemplate.js"
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

router.post("/OtpGenerator", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(401).json({ message: "Email is Required!" });
        }

        const otp = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        // Store OTP in cookie securely
        res.cookie("OTP", otp, {
            httpOnly: true,
            maxAge: 5 * 60 * 1000,
        });

        const mailOptions = MailTemplateOTP(email, otp);

        await SendMail(transporter, mailOptions);
        res.json({ Message: "Email Sended", OTP: otp })

    } catch (error) {
        console.error("Error generating OTP:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});




router.post('/ForgetPassword', async (req, res) => {
    try {
        const { email } = req.body;
        console.log(email);

        const users = await User.findOne({ email });
        console.log(users);


        if (!users) {
            return res.status(400).json({ message: "Email is not registered" });
        }
        console.log(users);

        const Payload = {
            name: users.name,
            email: users.email
        }
        console.log(Payload);


        const Token = GeneratePassRecoveryToken(Payload)

        res.cookie('PasswordRecovery', Token, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
            maxAge: 24 * 60 * 60 * 1000
        });






        const resetLink = `http://localhost:5173/ChangePassword?token=${Token}`;

        var mailOptions = {
            from: {
                name: "CodeAscend",
                address: "alishah19477.as@gmail.com"
            },
            to: email,
            subject: 'Forget Password Request',
            text: `Hello ${users.name},\n\nWe hope this email finds you well. This is a sample email template that you can use to send messages to your contacts.\n\nFeel free to customize this template to fit your needs. You can add more sections, links, or images as needed.\n\nBest regards,\nYour Name\n\nThis is an automated message. Please do not reply directly to this email.`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Email Template</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: auto;
                    background: #fff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333;
                }
                p {
                    line-height: 1.6;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 0.8em;
                    color: #777;
                }
            </style>
        </head>
        <body>
            <h1>Hello From CodeAscend,</h1>
            <p>Click on the link to reset your password: <a href="${resetLink}">Reset Password</a></p>
            <p>This is an automated message. Please do not reply directly to this email.</p>
        </body>
        </html>
        `
        };
        SendMail(transporter, mailOptions);
        return res.status(200).json({
            message: "we've sent you a link to reset your password. Please check your inbox (and spam folder just in case)!",
            user: users, Token
        });

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


router.post("/TokenExtract", (req, res) => {
    try {
        const { token } = req.body;
        const data = VerifyPassRecoveryToken(token)
        return res.status(200).json({
            message: "Data in Token",
            user: data
        });
    } catch (error) {
        console.log(error);

    }


})


router.post("/ChangePassword", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        user.password = hashPassword;
        await user.save();

        res.send({ message: "Password Changed", redirect: true });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});



router.post("/uploadImg", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No File is Uploaded" })
    }
    const ImageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    return res.status(200).json({ message: "Image uploaded successfully", Image: ImageUrl });

})


router.post("/VerifyEmail", async (req, res) => {
    try {
        const { email } = req.body
        const isExist = await User.find({ email });
        console.log(isExist.length);

        if (isExist.length > 0) {
            return res.status(400).json({ Message: "Email Already Exist", isExist: true })
        }
        res.json({ Message: "Unique Email", isExist: false })
    } catch (error) {
        console.log("Error");

    }
})

export default router