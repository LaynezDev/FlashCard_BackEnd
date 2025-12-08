const db = require('../config/db');

// Obtener Cursos del Usuario
exports.getMyCourses = async (req, res) => {
    // 1. Imprime esto para depurar en la consola de VS Code
    console.log("Usuario solicitando cursos:", req.user); 

    const { id_usuario, tipo_usuario, id_centro } = req.user;

    let query = '';
    let params = [];

    // Si es profesor o admin, ve TODO lo del centro
    if (tipo_usuario === 'Admin' || tipo_usuario === 'Profesor') {
        
        // VALIDACIÓN DE SEGURIDAD
        if (!id_centro) {
            return res.status(400).json({ msg: "Usuario sin centro asignado. Contacte soporte." });
        }

        query = 'SELECT * FROM Cursos WHERE id_centro = ?';
        params = [id_centro];
    } else {
        // Alumnos...
        query = `
            SELECT C.* FROM Cursos C
            INNER JOIN Inscripciones I ON C.id_curso = I.id_curso
            WHERE I.id_usuario = ?
        `;
        params = [id_usuario];
    }
    try {
        const [rows] = await db.query(query, params);
        console.log("Cursos encontrados:", rows.length); // Ver en consola
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener cursos' });
    }
};

// Obtener Decks de un Curso específico
exports.getDecksByCourse = async (req, res) => {
    const { courseId } = req.params;
    
    // Unimos Decks con DeckCursos
    const query = `
        SELECT D.* FROM Decks D
        INNER JOIN DeckCursos DC ON D.id_deck = DC.id_deck
        WHERE DC.id_curso = ?
    `;

    try {
        const [rows] = await db.query(query, [courseId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener decks del curso' });
    }
};

// Crear un nuevo curso
exports.createCourse = async (req, res) => {
   // 1. VERIFICACIÓN DE ROL
    // Si no es admin ni profesor, rechazamos la petición
    if (req.user.tipo_usuario !== 'admin' && req.user.tipo_usuario !== 'Profesor') {
        return res.status(403).json({ msg: 'Acceso denegado. Solo profesores pueden crear cursos.' });
    }
    const { nombre_curso, descripcion } = req.body;
    const { id_centro } = req.user; // Obtenido del token

    
    if (!nombre_curso) {
        return res.status(400).json({ msg: 'El nombre del curso es obligatorio' });
    }

    const query = 'INSERT INTO Cursos (nombre_curso, descripcion, id_centro) VALUES (?, ?, ?)';
    
    try {
        await db.query(query, [nombre_curso, descripcion, id_centro]);
        res.status(201).json({ msg: 'Curso creado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al crear curso' });
    }
};

// Eliminar un curso (y sus decks/tarjetas en cascada idealmente)
exports.deleteCourse = async (req, res) => {
   // 1. VERIFICACIÓN DE ROL
    if (req.user.tipo_usuario !== 'admin' && req.user.tipo_usuario !== 'Profesor') {
        return res.status(403).json({ msg: 'Acceso denegado.' });
    }
    const { courseId } = req.params;
    try {
        // Nota: Si no tienes ON DELETE CASCADE en MySQL, deberías borrar primero 
        // inscripciones y decks asociados manualmente aquí.
        await db.query('DELETE FROM Cursos WHERE id_curso = ?', [courseId]);
        res.json({ msg: 'Curso eliminado' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar curso' });
    }
};

// Inscribir un alumno a un curso
exports.enrollStudent = async (req, res) => {
    // Solo profesores/admin pueden inscribir
    if (req.user.tipo_usuario !== 'admin' && req.user.tipo_usuario !== 'Profesor') {
        return res.status(403).json({ msg: 'No tienes permiso para inscribir alumnos.' });
    }

    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) {
        return res.status(400).json({ msg: 'Faltan datos (studentId o courseId)' });
    }

    // Query para evitar duplicados (IGNORE inserta solo si no existe, si tienes PK compuesta)
    // O hacemos un SELECT primero. Usaremos una inserción directa simple.
    const query = 'INSERT INTO Inscripciones (id_usuario, id_curso) VALUES (?, ?)';

    try {
        await db.query(query, [studentId, courseId]);
        res.json({ msg: 'Alumno inscrito correctamente' });
    } catch (error) {
        // Error 1062 es duplicado en MySQL
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: 'El alumno ya está inscrito en este curso.' });
        }
        res.status(500).json({ msg: 'Error al inscribir alumno' });
    }
};