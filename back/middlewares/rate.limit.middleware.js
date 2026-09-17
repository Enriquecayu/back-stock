import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos permitidos
    message: {
        error: "Demasiados intentos fallidos de inicio de sesión. Por favor, intente nuevamente más tarde."
    },
    standardHeaders: true,
    legacyHeaders: false,
});