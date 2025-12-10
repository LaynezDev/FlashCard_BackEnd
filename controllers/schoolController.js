const db = require('../config/db');

// --- GRADOS ---

// Obtener grados del centro
exports.getGrades = async (req, res) => {
    const { id_centro } = req.user;
    try {
        const [rows] = await db.query('SELECT * FROM Grados WHERE id_centro = ?', [id_centro]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener grados' });
    }
};

// Crear grado
exports.createGrade = async (req, res) => {
    const { nombre_grado } = req.body;
    const { id_centro } = req.user;
    
    if (req.user.tipo_usuario !== 'Admin') return res.status(403).json({ msg: 'Acceso denegado' });

    try {
        await db.query('INSERT INTO Grados (nombre_grado, id_centro) VALUES (?, ?)', [nombre_grado, id_centro]);
        res.json({ msg: 'Grado creado' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear grado' });
    }
};

// --- SECCIONES ---

// Obtener secciones de un grado
exports.getSections = async (req, res) => {
    const { gradeId } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM Secciones WHERE id_grado = ?', [gradeId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener secciones' });
    }
};

// Crear sección
exports.createSection = async (req, res) => {
    const { nombre_seccion, id_grado } = req.body;
    
    if (req.user.tipo_usuario !== 'Admin') return res.status(403).json({ msg: 'Acceso denegado' });

    try {
        await db.query('INSERT INTO Secciones (nombre_seccion, id_grado) VALUES (?, ?)', [nombre_seccion, id_grado]);
        res.json({ msg: 'Sección creada' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear sección' });
    }
};