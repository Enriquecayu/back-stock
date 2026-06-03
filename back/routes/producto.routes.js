import express from 'express';
import {
    getProductos,
    createProducto,
    updateProducto,
    deleteProducto,
    getCategoriasUnicas,
    descargarReporteMensualExcel
} from '../controllers/producto.controller.js';

const router = express.Router();

// 1. Rutas Estáticas Principales y de Creación
router.get('/', getProductos);                            // GET /api/productos
router.post('/', createProducto);                          // POST /api/productos

// 2. Rutas Especiales Fijas (¡SIEMPRE ARRIBA DE LOS PARÁMETROS DINÁMICOS!)
router.get('/categorias-existentes', getCategoriasUnicas);
router.get('/reporte-mensual/excel', descargarReporteMensualExcel);

// 3. Rutas Dinámicas con Parámetros (SIEMPRE ABAJO DE TODO)
router.put('/:id', updateProducto);                        // PUT /api/productos/1
router.delete('/:id', deleteProducto);                     // DELETE /api/productos/1

export default router;