const db = require('../config/db');
const logger = require('../config/logger');

/**
 * Obtiene todos los grados del centro educativo del usuario.
 * @route GET /api/v1/school/grades
 * @returns {Array} Lista de grados con id_grado, nombre_grado e id_centro
 */
exports.getGrades = async (req, res) => {
    const { id_centro } = req.user;
    try {
        const [rows] = await db.query('SELECT * FROM Grados WHERE id_centro = ?', [id_centro]);
        res.json(rows);
    } catch (error) {
        logger.error({ err: error.message }, 'Error al obtener grados');
        res.status(500).json({ msg: 'Error al obtener grados' });
    }
};

/**
 * Crea un nuevo grado en el centro educativo.
 * Solo accesible para usuarios con rol Admin.
 * @route POST /api/v1/school/grades
 * @param {string} req.body.nombre_grado - Nombre del grado (ej: "1ro Primaria")
 * @returns {object} { msg: 'Grado creado' }
 */
exports.createGrade = async (req, res) => {
    const { nombre_grado } = req.body;
    const { id_centro } = req.user;

    if (req.user.tipo_usuario !== 'Admin') return res.status(403).json({ msg: 'Acceso denegado' });

    try {
        await db.query('INSERT INTO Grados (nombre_grado, id_centro) VALUES (?, ?)', [nombre_grado, id_centro]);
        res.json({ msg: 'Grado creado' });
    } catch (error) {
        logger.error({ err: error.message }, 'Error al crear grado');
        res.status(500).json({ msg: 'Error al crear grado' });
    }
};

/**
 * Obtiene todas las secciones de un grado específico.
 * @route GET /api/v1/school/grades/:gradeId/sections
 * @param {string} req.params.gradeId - ID del grado
 * @returns {Array} Lista de secciones con id_seccion, nombre_seccion e id_grado
 */
exports.getSections = async (req, res) => {
    const { gradeId } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM Secciones WHERE id_grado = ?', [gradeId]);
        res.json(rows);
    } catch (error) {
        logger.error({ err: error.message }, 'Error al obtener secciones');
        res.status(500).json({ msg: 'Error al obtener secciones' });
    }
};

/**
 * Crea una nueva sección dentro de un grado.
 * Solo accesible para usuarios con rol Admin.
 * @route POST /api/v1/school/sections
 * @param {string} req.body.nombre_seccion - Nombre de la sección (ej: "A", "B", "Matutina")
 * @param {number} req.body.id_grado - ID del grado al que pertenece
 * @returns {object} { msg: 'Sección creada' }
 */
exports.createSection = async (req, res) => {
    const { nombre_seccion, id_grado } = req.body;

    if (req.user.tipo_usuario !== 'Admin') return res.status(403).json({ msg: 'Acceso denegado' });

    try {
        await db.query('INSERT INTO Secciones (nombre_seccion, id_grado) VALUES (?, ?)', [nombre_seccion, id_grado]);
        res.json({ msg: 'Sección creada' });
    } catch (error) {
        logger.error({ err: error.message }, 'Error al crear sección');
        res.status(500).json({ msg: 'Error al crear sección' });
    }
};
