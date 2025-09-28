const multer = require("multer");
const path = require("path")

const partialStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploadPartial"));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedFile = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedFile.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only 'image/jpeg', 'image/png', 'image/jpg'"));
    }
};

const uploadPartial = multer({ storage: partialStorage, fileFilter });

module.exports = { uploadPartial };
