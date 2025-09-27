const User = require("../models/user.model.js");
const bcryptjs = require("bcryptjs");
const { errorHandler } = require("../utils/error.js");
const jwt = require("jsonwebtoken");
const { GenerateToken } = require("../utils/Token.js");

const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const payload = { User: user };
      const token = GenerateToken(payload);
      res.cookie("FreashToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        maxAge: 24 * 60 * 60 * 1000,
      });
      return res.status(200).json({
        message: "Authorized",
        user: user,
        token: token,
      });
    } else {
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);

      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      const newUser = new User({
        name:
          req.body.name.split(" ").join("").toLowerCase() +
          Math.random().toString(36).slice(-4),
        email: req.body.email,
        password: hashedPassword,
        profileImage: req.body.photo,
      });
      await newUser.save();
      const payload = { User: newUser };
      const token = GenerateToken(payload);

      res.cookie("FreashToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        maxAge: 24 * 60 * 60 * 1000,
      });
      return res.status(200).json({
        message: "Authorized",
        user: newUser,
        token: token,
      });
    }
  } catch (error) {
    next(error);
  }
};

const signOut = async (req, res, next) => {
  try {
    res.clearCookie("access_token");
    res.status(200).json("User has been logged out!");
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          profileImage: req.body.avatar,
        },
      },
      { new: true }
    );

    const { password, ...rest } = updatedUser._doc;

    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  google,
  signOut,
  updateUser,
};
