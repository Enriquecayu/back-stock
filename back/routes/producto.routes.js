// routes/producto.routes.js
import express from 'express';
import {
    getProductos,
    createProducto,
    updateProducto,
    deleteProducto,
    getCategoriasUnicas,
    descargarReporteMensualExcel
} from '../controllers/producto.controller.js';

// 🎯 CLAVE: Importamos los guardianes de seguridad
import { verificarToken, esAdministrador } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 1. Rutas Estáticas Principales y de Creación (🔒 Ahora protegidas)
router.get('/', verificarToken, getProductos);                           // GET /api/productos
router.post('/', verificarToken, esAdministrador, createProducto);                         // POST /api/productos

// 2. Rutas Especiales Fijas (¡SIEMPRE ARRIBA DE LOS PARÁMETROS DINÁMICOS!)
router.get('/categorias-existentes', verificarToken, getCategoriasUnicas);
router.get('/reporte-mensual/excel', verificarToken, esAdministrador, descargarReporteMensualExcel);

// 3. Rutas Dinámicas con Parámetros (SIEMPRE ABAJO DE TODO)
router.put('/:id', verificarToken, esAdministrador, updateProducto);                        // PUT /api/productos/1
router.delete('/:id', verificarToken, esAdministrador, deleteProducto);                     // DELETE /api/productos/1

export default router;