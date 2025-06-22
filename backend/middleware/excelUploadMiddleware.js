const multer = require("multer");
const path = require("path");

// Storage for Excel uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/excel/"); // or "public/uploads/excel/"
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// File filter for Excel MIME types
const excelFileFilter = (req, file, cb) => {
    if (
        file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.mimetype === "application/vnd.ms-excel"
    ) {
        cb(null, true);
    } else {
        cb(new Error("Only Excel files are allowed (.xlsx or .xls)"), false);
    }
};

const excelUpload = multer({ storage, fileFilter: excelFileFilter });

module.exports = excelUpload;
