import { Router } from 'express';
import { createSector, getSectores } from '../controllers/sector.controller.js';
import { verificarToken, esAdministrador } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verificarToken, getSectores);
router.post('/', verificarToken, esAdministrador, createSector);

export default router; // 👈 Clave que esté este export