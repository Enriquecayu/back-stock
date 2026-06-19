// middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';

// 1. PASO OBLIGATORIO: Verificar que el usuario está logueado y su token es real
export const verificarToken = (req, res, next) => {
    // Buscamos el token en los encabezados HTTP (Authorization: Bearer TOKEN)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Si no hay token, lo rebotamos inmediatamente con un 401 (No autenticado)
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado: No se proporcionó un token de sesión.' });
    }

    try {
        // Desencriptamos y validamos el token usando la clave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_provisional_centinela');
        
        // ¡ESTO ES CLAVE! Guardamos los datos del usuario (id y rol) dentro de 'req.usuario'
        // para que los siguientes middlewares y controladores sepan quién está operando
        req.usuario = decoded; 
        
        next(); // Autorizado a pasar al siguiente eslabón
    } catch (error) {
        // Si el token expiró o lo tocaron/modificaron, da error 403 (Prohibido)
        return res.status(403).json({ error: 'Token inválido o expirado. Inicie sesión nuevamente.' });
    }
};

// 2. CANDADO EXCLUSIVO: Solo permite el paso al Administrador (Permisos al 100%)
export const esAdministrador = (req, res, next) => {
    if (req.usuario && req.usuario.rol === 'Administrador') {
        return next(); // Si es Admin, pasa limpito
    }
    // Si es Cocinera o cualquier otra cosa, rebote automático
    return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de Administrador.' });
};

// 3. PERMISO COMPARTIDO: Permite el paso tanto a Admin como a Cocineras
export const puedeRegistrarConsumo = (req, res, next) => {
    if (req.usuario && (req.usuario.rol === 'Administrador' || req.usuario.rol === 'Cocinera')) {
        return next(); // Ambos roles están autorizados para interactuar con la cocina
    }
    return res.status(403).json({ error: 'Acceso denegado: No tienes autorización para realizar esta acción.' });
};