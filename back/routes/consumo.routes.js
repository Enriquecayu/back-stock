// routes/consumo.routes.js
import express from 'express';
import { createConsumo, getConsumos } from '../controllers/consumo.controller.js';
import { verificarToken, puedeRegistrarConsumo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ✅ Permiso Compartido: Registrar salidas directas del stock y auditar los consumos operativos
router.post('/', verificarToken, puedeRegistrarConsumo, createConsumo); // POST /api/consumos
router.get('/', verificarToken, puedeRegistrarConsumo, getConsumos);   // GET /api/consumos

export default router;