import express from 'express';
import { getLotes, createLote, updateLote } from '../controllers/lote.controller.js';

const router = express.Router();

router.get('/', getLotes);          // GET /api/lotes
router.post('/', createLote);        // POST /api/lotes
router.put('/:id', updateLote);      // PUT /api/lotes/id

export default router;