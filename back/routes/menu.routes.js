// routes/menu.routes.js
import { Router } from 'express';
import { createMenu, getMenus } from '../controllers/menu.controller.js';
import { verificarToken, esAdministrador, puedeRegistrarConsumo } from '../middlewares/auth.middleware.js';

const router = Router();

// 🔒 Solo Admin: Ningún tercero ni cocinera puede crear o alterar las recetas base del hospital
router.post('/', verificarToken, createMenu); // POST /api/menus

// ✅ Permiso Compartido: Tanto Admin como Cocineras pueden ver las recetas cargadas
router.get('/', verificarToken, puedeRegistrarConsumo, getMenus);    // GET /api/menus

export default router;