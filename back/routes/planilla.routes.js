// routes/planilla.routes.js
import { Router } from 'express';
import { registrarPlanillaDiaria, getHistorialPlanillas } from '../controllers/planilla.controller.js';
import { verificarToken, puedeRegistrarConsumo } from '../middlewares/auth.middleware.js';

const router = Router();

// ✅ Permiso Compartido: Cargar las planillas de raciones diarias (descuento FIFO) y ver su historial
router.post('/', verificarToken, puedeRegistrarConsumo, registrarPlanillaDiaria); // POST /api/planillas
router.get('/', verificarToken, puedeRegistrarConsumo, getHistorialPlanillas);    // GET /api/planillas

export default router;