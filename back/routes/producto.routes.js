import express from 'express';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../controllers/producto.controller.js';

const router = express.Router();

router.get('/', getProductos);          // GET /api/productos
router.post('/', createProducto);        // POST /api/productos
router.put('/:id', updateProducto);      // PUT /api/productos/1
router.delete('/:id', deleteProducto);   // DELETE /api/productos/1

export default router;