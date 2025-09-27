const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const Key = process.env.PassRecoverKey;

const GeneratePassRecoveryToken = (payload) => {
    return jwt.sign(payload, Key, { expiresIn: "1h" });
};

const VerifyPassRecoveryToken = (Token) => {
    return jwt.verify(Token, Key);
};

const PassRecoveryMiddleware = (req, res, next) => {
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
        console.log(decoded, "decoded");

        // If needed, attach decoded data to request
        // req.user = decoded;

        next();
    } catch (error) {
        return res.status(403).json({ Message: "Invalid Token", error });
    }
};

module.exports = {
    GeneratePassRecoveryToken,
    VerifyPassRecoveryToken,
    PassRecoveryMiddleware,
};
