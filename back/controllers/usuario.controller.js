// controllers/usuario.controller.js
import Usuario from '../models/Usuario.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// 🛡️ 1. REGISTRAR UN NUEVO USUARIO (Solo accesible por el Administrador)
export const registrar = async (req, res) => {
    try {
        const { nombreCompleto, username, password, rol } = req.body;

        // Validar campos obligatorios
        if (!nombreCompleto || !username || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios (nombreCompleto, username, password).' });
        }

        // Verificar unicidad del username
        const usuarioExistente = await Usuario.findOne({ where: { username: username.trim() } });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El nombre de usuario ya se encuentra registrado.' });
        }

        // Encriptar contraseña con Hash (Fuerza de sal: 10)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear registro en la base de datos
        const nuevoUsuario = await Usuario.create({
            nombreCompleto: nombreCompleto.trim(),
            username: username.trim().toLowerCase(),
            password: hashedPassword,
            rol: rol || 'Cocinera' // Rol por defecto por principio de menor privilegio
        });

        return res.status(201).json({
            mensaje: 'Usuario registrado con éxito en el sistema.',
            usuario: {
                id: nuevoUsuario.id,
                nombreCompleto: nuevoUsuario.nombreCompleto,
                username: nuevoUsuario.username,
                rol: nuevoUsuario.rol
            }
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        return res.status(500).json({ error: 'Hubo un error interno en el servidor al crear el usuario.' });
    }
};

// 🔑 2. INICIAR SESIÓN (LOGIN GENERADOR DE TOKEN)
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
        }

        const usuario = await Usuario.findOne({ where: { username: username.trim().toLowerCase() } });
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        if (!usuario.activo) {
            return res.status(403).json({ error: 'El usuario se encuentra deshabilitado en el sistema.' });
        }

        const contraseñaCorrecta = await bcrypt.compare(password, usuario.password);
        if (!contraseñaCorrecta) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Firmar Token de sesión incluyendo ID y Rol
        const token = jwt.sign(
            {
                id: usuario.id,
                rol: usuario.rol
            },
            process.env.JWT_SECRET || 'clave_secreta_provisional_centinela',
            { expiresIn: '8h' }
        );

        return res.json({
            mensaje: 'Inicio de sesión exitoso.',
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
        return res.status(500).json({ error: 'Hubo un error interno en el servidor al procesar el inicio de sesión.' });
    }
};