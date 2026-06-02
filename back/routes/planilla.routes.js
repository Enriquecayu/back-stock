import { Router } from 'express';
import { registrarPlanillaDiaria, getHistorialPlanillas } from '../controllers/planilla.controller.js';

const router = Router();

router.post('/', registrarPlanillaDiaria); // POST /api/planillas -> Procesa la cocina del día y aplica FIFO
router.get('/', getHistorialPlanillas);    // GET /api/planillas  -> Muestra el historial de planillas hechas

export default router;