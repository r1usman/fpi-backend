import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config();
const Key = process.env.JWT_SECRET
export const GenerateToken = (Payload) => {
    return jwt.sign(Payload, Key, { expiresIn: "7D" });
}

export const VerifyToken = (Token) => {
    return jwt.verify(Token, Key);
}

export const Protect = (req, res, next) => {
    console.log("In protect");

    let token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        token = req.cookies.FreashToken;
    }

    if (!token) {
        return res.status(401).json({ Message: "Unauthorized, No Token Provided" });
    }

    try {
        const decoded = jwt.verify(token, Key);
        const user = decoded.User;
        console.log(user);

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ Message: "Invalid Token" });
    }
};


