# Chat Admin

## Descripción

**Chat Admin** es una aplicación web que permite a los administradores gestionar los archivos que tienes subidos a la plataforma de OpenAI. La aplicación incluye autenticación JWT, integración con MySQL, y se utiliza `React` en el frontend y `Node.js` con `Express` para el backend.

### Características

- Autenticación con JWT.
- Conexión con base de datos MySQL para gestión de usuarios.
- Integración con OpenAI para respuestas automatizadas.
- Frontend desarrollado en React utilizando `Vite` como herramienta de construcción.
- Backend utilizando Express.js con una API RESTful.
- Gestión de sesiones segura.

## Estructura del Proyecto

- `server.js`: Archivo principal del backend donde se configuran las rutas y la conexión con la base de datos MySQL.
- `Login.tsx`: Componente del frontend (React) para la pantalla de inicio de sesión.

## Requisitos

Antes de iniciar la aplicación, asegúrate de tener instalados los siguientes programas:

- **Node.js** (v14 o superior)
- **MySQL** (v5.7 o superior)
- **Git** (para clonar el repositorio)

### Variables de Entorno

Debes crear un archivo `.env` en el directorio raíz con las siguientes variables de entorno:

```env
VITE_OPENAI_API_KEY=tu_openai_api_key
DB_HOST=tu_host_de_base_de_datos
DB_USER=tu_usuario_de_mysql
DB_PORT=puerto_mysql
DB_PASSWORD=tu_password_de_mysql
DB_NAME=nombre_base_de_datos
JWT_SECRET=clave_secreta_jwt
