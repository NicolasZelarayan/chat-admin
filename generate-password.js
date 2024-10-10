import bcrypt from 'bcryptjs';

const password = 'Synagro123@';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error al hashear la contraseña:', err);
  } else {
    console.log('Contraseña hasheada:', hash);
    console.log('Usa este hash para insertar en la base de datos MySQL.');
  }
});