import express from 'express';
import { createConsumo, getConsumos } from '../controllers/consumo.controller.js';

const router = express.Router();

router.post('/', createConsumo); // POST /api/consumos
router.get('/', getConsumos);   // GET /api/consumos

export default router;