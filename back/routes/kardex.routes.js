import express from 'express';
import { getKardex, getKardexPorProducto, registrarSalidaFIFO } from '../controllers/kardex.controller.js';

const router = express.Router();

// 1. RUTAS ESTÁTICAS (Arriba)
router.get('/', getKardex);                      // GET /api/kardex (Ver historial completo)
router.post('/salida', registrarSalidaFIFO);    // POST /api/kardex/salida (Ejecutar el FIFO)

// 2. RUTAS DINÁMICAS / CON PARÁMETROS (Abajo)
router.get('/producto/:idProducto', getKardexPorProducto); // GET /api/kardex/producto/id (Filtro para React)

export default router;