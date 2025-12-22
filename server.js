// server.js
require("dotenv").config(); // Cargar variables de entorno
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const app = express();

// Importar rutas
const authRoutes = require("./routes/authRoutes");
const deckRoutes = require("./routes/deckRoutes");
const progressRoutes = require("./routes/progressRoutes");
const userRoutes = require("./routes/userRoutes");
const coursesRoutes = require("./routes/courseRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json()); // Habilitar la lectura de JSON en el body

// Rutas de la API
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/decks", deckRoutes);
app.use("/api/v1/progress", progressRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/courses", coursesRoutes);
app.use("/api/v1/school", schoolRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   console.log(`Server corriendo en el puerto ${PORT}`);
});
