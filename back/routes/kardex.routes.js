// routes/kardex.routes.js
import express from 'express';
import { getKardex, getKardexPorProducto } from '../controllers/kardex.controller.js';
import { verificarToken, esAdministrador } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 🔒 BLOQUEO TOTAL: Solo auditoría autorizada para rol de Administrador
router.get('/', verificarToken, esAdministrador, getKardex);                               // GET /api/kardex
router.get('/producto/:idProducto', verificarToken, esAdministrador, getKardexPorProducto); // GET /api/kardex/producto/id

export default router;