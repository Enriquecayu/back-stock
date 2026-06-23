// routes/lote.routes.js
import express from 'express';
import { getLotes, createLote, updateLote } from '../controllers/lote.controller.js';
import { verificarToken, esAdministrador } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 🔒 BLOQUEO TOTAL: El catálogo de lotes y el ingreso de mercancía es exclusivo del Administrador
router.get('/', verificarToken, getLotes);          // GET /api/lotes
router.post('/', verificarToken, esAdministrador, createLote);        // POST /api/lotes
router.put('/:id', verificarToken, esAdministrador, updateLote);      // PUT /api/lotes/id

export default router;