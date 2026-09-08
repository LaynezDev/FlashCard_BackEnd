const db = require('../config/db');

// Obtener Cursos del Usuario
exports.getMyCourses = async (req, res) => {
    const { id_usuario, tipo_usuario, id_centro } = req.user;

    let query = '';
    let params = [];

    // CASO 1: ADMINISTRADOR (Ve todo lo del centro)
    if (tipo_usuario === 'Admin') {
        // Opcional: Hacemos JOIN para traer el nombre del profesor asignado también
        query = `
            SELECT C.*, U.nombre as nombre_profesor 
            FROM Cursos C
            LEFT JOIN Usuarios U ON C.id_profesor = U.id_usuario
            WHERE C.id_centro = ?
        `;
        params = [id_centro];
    } 
    // CASO 2: PROFESOR (Ve solo LO SUYO) <-- AQUÍ ESTABA EL ERROR
    else if (tipo_usuario === 'Profesor') {
        query = `
            SELECT * FROM Cursos 
            WHERE id_profesor = ?
        `;
        params = [id_usuario];
    } 
    // CASO 3: ALUMNO (Ve solo donde está INSCRITO)
    else {
        query = `
            SELECT C.*, U.nombre as nombre_profesor 
            FROM Cursos C
            INNER JOIN Inscripciones I ON C.id_curso = I.id_curso
            LEFT JOIN Usuarios U ON C.id_profesor = U.id_usuario
            WHERE I.id_usuario = ?
        `;
        params = [id_usuario];
    }

    try {
        const [rows] = await db.query(query, params);
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

exports.deleteCourse = async (req, res) => {
   // 1. VERIFICACIÓN DE ROL
    if (req.user.tipo_usuario !== 'Admin' && req.user.tipo_usuario !== 'Profesor') {
        return res.status(403).json({ msg: 'Acceso denegado.' });
    }
    const { courseId } = req.params;
    try {
        await db.query('DELETE FROM Cursos WHERE id_curso = ?', [courseId]);
        res.json({ msg: 'Curso eliminado' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar curso' });
    }
};

// Inscribir un alumno a un curso
exports.enrollStudent = async (req, res) => {
    if (req.user.tipo_usuario !== 'Admin' && req.user.tipo_usuario !== 'Profesor') {
        return res.status(403).json({ msg: 'No tienes permiso para inscribir alumnos.' });
    }

    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) {
        return res.status(400).json({ msg: 'Faltan datos (studentId o courseId)' });
    }

    const query = 'INSERT INTO Inscripciones (id_usuario, id_curso) VALUES (?, ?)';

    try {
        await db.query(query, [studentId, courseId]);
        res.json({ msg: 'Alumno inscrito correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: 'El alumno ya está inscrito en este curso.' });
        }
        res.status(500).json({ msg: 'Error al inscribir alumno' });
    }
};

exports.createCourse = async (req, res) => {
    const { nombre_curso, descripcion, id_profesor } = req.body;
    const { id_centro, tipo_usuario, id_usuario } = req.user;
    
    let profesorAsignado = id_profesor;

    if (tipo_usuario === 'Profesor') {
        profesorAsignado = id_usuario;
    }

    const query = 'INSERT INTO Cursos (nombre_curso, descripcion, id_centro, id_profesor) VALUES (?, ?, ?, ?)';
    
    try {
        await db.query(query, [nombre_curso, descripcion, id_centro, profesorAsignado]);
        res.status(201).json({ msg: 'Curso creado y asignado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al crear curso' });
    }
};