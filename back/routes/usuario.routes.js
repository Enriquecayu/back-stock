// routes/usuario.routes.js
import { Router } from 'express';
import { registrar, login } from '../controllers/usuario.controller.js';
import { verificarToken, esAdministrador } from '../middlewares/auth.middleware.js';
import Usuario from '../models/Usuario.js';

const router = Router();

// 🔒 RESPALDO DE SEGURIDAD EXCELENTE: Solo un Administrador autenticado puede registrar nuevos usuarios
router.post('/registrar', verificarToken, esAdministrador, registrar);

// 🔑 PÚBLICO: Permite el inicio de sesión para obtener el token de acceso
router.post('/login', login);

router.post('/registro-inicial', async (req, res) => {
    try {
        const cuenta = await Usuario.count();
        if (cuenta > 0) return res.status(403).json({ error: "Ya existen usuarios, no puedes usar esta ruta." });

        // Llamamos directamente al controlador 'registrar'
        await registrar(req, res);
    } catch (error) {
        res.status(500).json({ error: "Error en el registro inicial" });
    }
});

export default router;