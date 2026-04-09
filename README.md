# FlashCard Backend

## Descripción

Este es el backend para la aplicación FlashCard, una plataforma de aprendizaje basada en tarjetas de memoria (flashcards). Proporciona una API RESTful para gestionar usuarios, mazos (decks), tarjetas, y el progreso de estudio de los usuarios.

## Características Principales

-   **Autenticación y Usuarios**:
    -   Registro y Login de usuarios con JWT (JSON Web Tokens).
    -   Roles de usuario: `Admin`, `Profesor`, `Alumno`.
-   **Gestión Académica**:
    -   Los `Admin` pueden crear y gestionar `Profesores` dentro de un centro educativo.
    -   Los `Profesores` pueden crear y gestionar `Alumnos` de su mismo centro.
    -   Posibilidad de actualizar contraseñas de alumnos por parte de profesores o administradores.
-   **Gestión de Mazos (Decks)**:
    -   Crear, obtener y eliminar mazos de tarjetas.
    -   Los mazos pueden ser públicos o privados para un curso específico.
-   **Gestión de Tarjetas (Flashcards)**:
    -   Crear, obtener y eliminar tarjetas dentro de un mazo.
    -   Soporte para imágenes en las tarjetas (subidas con Multer).
-   **Sistema de Estudio y Progreso**:
    -   Algoritmo de Repetición Espaciada (Spaced Repetition) para optimizar el aprendizaje.
    -   Selección inteligente de tarjetas a estudiar basado en el nivel de dominio del usuario.
    -   Registro del progreso y la confianza del usuario en cada tarjeta.
-   **Reportes y Estadísticas**:
    -   Cálculo del porcentaje de dominio de un mazo para un alumno.
    -   Reportes para profesores sobre el progreso de todos los alumnos de un curso en un mazo específico.

## Tecnologías Utilizadas

-   **Entorno**: Node.js
-   **Framework**: Express.js
-   **Base de Datos**: MySQL
-   **Autenticación**: JSON Web Tokens (JWT)
-   **Hashing de Contraseñas**: bcrypt
-   **Subida de Archivos**: Multer

## Estructura del Proyecto

```
.
├── config/         # Configuración de la base de datos (db.js)
├── controllers/    # Lógica para manejar las peticiones (request/response)
├── middleware/     # Middlewares (ej. para verificar JWT)
├── models/         # Lógica de negocio y comunicación con la BD
├── routes/         # Definición de las rutas de la API
├── uploads/        # Directorio para imágenes subidas (ignorado por git)
├── .env            # Variables de entorno (local)
├── .env.example    # Ejemplo de variables de entorno
└── server.js       # Punto de entrada de la aplicación
```

## API Endpoints

A continuación se listan los principales endpoints de la API. Todas las rutas están prefijadas con `/api/v1`.

### Autenticación (`/auth`)

-   `POST /register`: Registrar un nuevo usuario.
-   `POST /login`: Iniciar sesión y obtener un token JWT.

### Usuarios (`/users`)

-   `GET /students`: (Profesor/Admin) Obtiene la lista de alumnos de su centro.
-   `POST /students`: (Profesor/Admin) Crea un nuevo alumno en su centro.
-   `PUT /students/:id/password`: (Profesor/Admin) Actualiza la contraseña de un alumno.
-   `GET /teachers`: (Admin) Obtiene la lista de profesores de su centro.
-   `POST /teachers`: (Admin) Crea un nuevo profesor en su centro.

### Mazos y Tarjetas (`/decks`, `/flashcards`)

-   `POST /decks`: Crear un nuevo mazo.
-   `GET /decks`: Obtener los mazos disponibles para el usuario.
-   `GET /decks/:deckId`: Obtener los detalles y tarjetas de un mazo.
-   `DELETE /decks/:deckId`: Eliminar un mazo.
-   `POST /flashcards`: Crear una nueva tarjeta en un mazo.
-   `DELETE /flashcards/:cardId`: Eliminar una tarjeta.

### Estudio y Progreso (`/study`, `/report`)

-   `GET /study/:deckId`: Obtener el lote de tarjetas para una sesión de estudio.
-   `POST /study/review/:cardId`: Registrar la revisión de una tarjeta (con nivel de confianza).
-   `GET /decks/:deckId/stats`: Obtener las estadísticas de progreso del usuario para un mazo.
-   `GET /report/course/:courseId/deck/:deckId`: (Profesor/Admin) Obtener un reporte del progreso de los alumnos en un mazo.

## Instalación y Puesta en Marcha

### Prerrequisitos

-   Node.js (v16 o superior)
-   npm o yarn
-   Servidor de MySQL

### Pasos

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repositorio>
    cd FlashCard_BackEnd
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto, basándote en el archivo `.env.example`. Deberás configurar la conexión a tu base de datos y un secreto para JWT.

4.  **Configurar la Base de Datos:**
    Asegúrate de que tu servidor de MySQL esté corriendo y crea una base de datos con el nombre que especificaste en el archivo `.env` (ej. `flashcard_db`). Luego, ejecuta los scripts de migración o crea las tablas manualmente según el esquema del proyecto.

5.  **Iniciar el servidor:**
    ```bash
    npm start
    ```
    El servidor se ejecutará en `http://localhost:3000` (o el puerto que se configure).