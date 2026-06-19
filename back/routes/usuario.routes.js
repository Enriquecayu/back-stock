// routes/usuario.routes.js
import { Router } from 'express';
import { registrar, login } from '../controllers/usuario.controller.js';

const router = Router();

// Ruta para dar de alta usuarios
router.post('/registrar', registrar);

// Nueva Ruta para iniciar sesión
router.post('/login', login);

export default router;