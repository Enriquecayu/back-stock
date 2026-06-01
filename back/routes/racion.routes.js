import express from 'express';
import {
    getRaciones,
    createRacion,
    updateRacion,
    deleteRacion,
    getRacionesBorradas,
    restoreRacion
} from '../controllers/racion.controller.js';

const router = express.Router();

// 1. RUTAS ESTÁTICAS (Siempre arriba de todo)
router.get('/', getRaciones);                   // GET /api/raciones
router.get('/borradas', getRacionesBorradas);   // GET /api/raciones/borradas
router.post('/', createRacion);                 // POST /api/raciones

// 2. RUTAS DINÁMICAS / CON PARÁMETROS (Siempre abajo)
router.put('/:id', updateRacion);                // PUT /api/raciones/id
router.delete('/:id', deleteRacion);             // DELETE /api/raciones/id
router.patch('/restaurar/:id', restoreRacion);   // PATCH /api/raciones/restaurar/id

export default router;