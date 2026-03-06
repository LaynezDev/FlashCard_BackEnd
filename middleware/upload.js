const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Los archivos se guardarán en la carpeta 'uploads'
    },
    filename: (req, file, cb) => {
        // Nombre único: timestamp + extensión original
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Error: Solo se permiten imágenes (jpeg, jpg, png, gif)');
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
    fileFilter: fileFilter
});

module.exports = upload;