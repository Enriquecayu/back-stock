// controllers/usuario.controller.js
import Usuario from '../models/Usuario.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// ... (Acá arriba sigue tu función registrar) ...

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Validar que no vengan campos vacíos
        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
        }

        // 2. Buscar si el usuario existe en la base de datos
        const usuario = await Usuario.findOne({ where: { username } });
        if (!usuario) {
            // Mandamos un mensaje genérico por seguridad (para no dar pistas a atacantes)
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 3. Verificar si el usuario está activo
        if (!usuario.activo) {
            return res.status(403).json({ error: 'El usuario se encuentra deshabilitado' });
        }

        // 4. Comparar la contraseña ingresada con el hash de la base de datos
        const contraseñaCorrecta = await bcrypt.compare(password, usuario.password);
        if (!contraseñaCorrecta) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 5. Crear el Token JWT
        // Es clave meter el ROL acá adentro para que el sistema sepa qué permisos darle
        const token = jwt.sign(
            {
                id: usuario.id,
                rol: usuario.rol
            },
            process.env.JWT_SECRET || 'clave_secreta_provisional_centinela', // Usa variable de entorno idealmente
            { expiresIn: '8h' } // El token expira en 8 horas (la jornada laboral)
        );

        // 6. Responder al cliente enviando el token y los datos básicos
        return res.json({
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombreCompleto: usuario.nombreCompleto,
                username: usuario.username,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        return res.status(500).json({ error: 'Hubo un error en el servidor' });
    }
};