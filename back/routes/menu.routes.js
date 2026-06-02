import { Router } from 'express';
import { createMenu, getMenus } from '../controllers/menu.controller.js';

const router = Router();

router.post('/', createMenu); // POST /api/menus -> Para registrar una receta nueva
router.get('/', getMenus);    // GET /api/menus  -> Para listar todas las recetas cargadas

export default router;