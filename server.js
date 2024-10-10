import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Pool de conexiones MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Probar la conexión a MySQL al iniciar el servidor
pool.getConnection()
  .then(() => {
    console.log('Conexión a MySQL exitosa');
  })
  .catch(err => {
    console.error('Error al conectar a MySQL:', err);
  });

// Ruta para el login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    // Si no se encuentra el usuario
    if (rows.length === 0) {
      console.log('Usuario no encontrado:', username);
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    // Si la contraseña no coincide
    if (!passwordMatch) {
      console.log('Contraseña incorrecta para usuario:', username);
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Generar token JWT
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Login exitoso para usuario:', username);

    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
