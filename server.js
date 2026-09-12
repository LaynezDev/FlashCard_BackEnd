// server.js
require("dotenv").config();
const express = require("express");
const path = require('path');
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pinoHttp = require("pino-http");
const logger = require("./config/logger");
const app = express();

// Importar rutas
const authRoutes = require("./routes/authRoutes");
const deckRoutes = require("./routes/deckRoutes");
const progressRoutes = require("./routes/progressRoutes");
const userRoutes = require("./routes/userRoutes");
const coursesRoutes = require("./routes/courseRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
const errorHandler = require("./middleware/errorHandler");
// Rate limiting para auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 intentos por ventana
    message: { msg: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(pinoHttp({ logger }));
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
}));
app.use(express.json()); // Habilitar la lectura de JSON en el body

app.use("/api/v1/auth", authLimiter);

app.get("/api/v1/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Hacer que la carpeta 'uploads' sea accesible vía URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const fs = require('fs');
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}

// Rutas de la API
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/decks", deckRoutes);
app.use("/api/v1/progress", progressRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/courses", coursesRoutes);
app.use("/api/v1/school", schoolRoutes);

app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   logger.info(`Server corriendo en el puerto ${PORT}`);
});
