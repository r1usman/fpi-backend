const express = require("express");
const bcrypt = require("bcryptjs");
const otpGenerator = require("otp-generator");

const User = require("../models/user.model");
const { GenerateToken, VerifyToken, Protect } = require("../utils/Token");
const upload = require("../Middleware/uploadMiddleware");
const { transporter, SendMail } = require("../utils/Mail");
const {
  GeneratePassRecoveryToken,
  PassRecoveryMiddleware,
  VerifyPassRecoveryToken,
} = require("../utils/PasswordResetToken");
const { MailTemplateOTP } = require("../utils/MailTemplate");
const { google, updateUser } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/google", google);
router.post("/update/:id", updateUser);

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, profileImageUrl, role } = req.body;
    const userexit = await User.findOne({ email });
    if (userexit) {
      return res.status(400).json({ Message: "Email already Registered..." });
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashPassword,
      profileImage: profileImageUrl,
      status: role,
    });

    if (user) {
      return res
        .status(201)
        .json({ Message: "User Added Successfully", User: user });
    } else {
      return res.status(500).json({ Message: "User creation failed" });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: error });
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

    res.cookie("FreashToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      message: "Authorized",
      user: checkUser,
      token: token,
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

    res.cookie("OTP", otp, {
      httpOnly: true,
      maxAge: 5 * 60 * 1000,
    });

    const mailOptions = MailTemplateOTP(email, otp);
    await SendMail(transporter, mailOptions);
    res.json({ Message: "Email Sended", OTP: otp });
  } catch (error) {
    console.error("Error generating OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/ForgetPassword", async (req, res) => {
  try {
    const { email } = req.body;
    const users = await User.findOne({ email });

    if (!users) {
      return res.status(400).json({ message: "Email is not registered" });
    }

    const Payload = { name: users.name, email: users.email };
    const Token = GeneratePassRecoveryToken(Payload);

    res.cookie("PasswordRecovery", Token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const resetLink = `http://localhost:5173/ChangePassword?token=${Token}`;

    const mailOptions = {
      from: { name: "CodeAscend", address: "alishah19477.as@gmail.com" },
      to: email,
      subject: "Forget Password Request",
      html: `<p>Click here to reset your password: <a href="${resetLink}">Reset Password</a></p>`,
    };

    await SendMail(transporter, mailOptions);
    return res.status(200).json({
      message:
        "we've sent you a link to reset your password. Please check your inbox!",
      user: users,
      Token,
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
      res.status(404).json({ message: "User Not Found" });
    }
    else {
      res.json({ user: UserProfile });

    }

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

router.post("/TokenExtract", (req, res) => {
  try {
    const { token } = req.body;
    const data = VerifyPassRecoveryToken(token);
    return res.status(200).json({
      message: "Data in Token",
      user: data,
    });
  } catch (error) {
    console.log(error);
  }
});

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
    return res.status(400).json({ message: "No File is Uploaded" });
  }
  const ImageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  return res.status(200).json({ message: "Image uploaded successfully", Image: ImageUrl });
});

router.post("/VerifyEmail", async (req, res) => {
  try {
    const { email } = req.body;
    const isExist = await User.find({ email });

    if (isExist.length > 0) {
      return res.status(400).json({ Message: "Email Already Exist", isExist: true });
    }
    res.json({ Message: "Unique Email", isExist: false });
  } catch (error) {
    console.log("Error");
  }
});

module.exports = router;
