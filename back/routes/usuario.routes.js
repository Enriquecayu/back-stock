// routes/usuario.routes.js
import { Router } from 'express';
import { registrar, login } from '../controllers/usuario.controller.js';
import { verificarToken, esAdministrador } from '../middlewares/auth.middleware.js';
import { loginLimiter } from '../middlewares/rate.limit.middleware.js';

const router = Router();

// 🔒 RESPALDO DE SEGURIDAD EXCELENTE: Solo un Administrador autenticado puede registrar nuevos usuarios
router.post('/registrar', verificarToken, esAdministrador, registrar);

// 🔑 PÚBLICO: Permite el inicio de sesión protegido contra ataques de fuerza bruta con loginLimiter
router.post('/login', loginLimiter, login);

export default router;