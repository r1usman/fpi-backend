import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const Key = process.env.PassRecoverKey

export const GeneratePassRecoveryToken = (payload) => {
    return jwt.sign(payload, Key, { expiresIn: '1h' })
}
export const VerifyPassRecoveryToken = (Token) => {
    return jwt.verify(Token, Key);
}

export const PassRecoveryMiddleware = (req, res, next) => {
    console.log("In protect");

    let token = req.headers.authorization?.split(" ")[1];
    console.log("Token from header", token);


    if (!token) {
        token = req.cookies.PasswordRecovery;
        console.log("Token from Cookies", token);
    }

    if (!token) {
        return res.status(401).json({ Message: "Unauthorized, No Token Provided" });
    }

    try {
        const decoded = VerifyPassRecoveryToken(token);
        console.log(decoded);

        // const user = decoded.User;
        // console.log(user);

        console.log(decoded, "decoded");


        // req.user = user;

        // req.user = decoded;  // Store user data in request
        next();
    } catch (error) {
        return res.status(403).json({ Message: "Invalid Token", error });
    }
}
