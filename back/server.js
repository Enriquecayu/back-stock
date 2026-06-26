// server.js
import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';

// 🎯 IMPORTANTE: Agregamos el modelo 'Usuario' a las importaciones estructurales
import { Producto, LoteStock, Kardex, PlanillaRacion, Consumo, Menu, MenuIngrediente, Usuario } from "./models/index.js";

// IMPORT DE RUTAS
import usuarioRoutes from './routes/usuario.routes.js'; // 🎯 NUEVO: Importamos las rutas de autenticación
import productoRoutes from './routes/producto.routes.js';
import loteRoutes from "./routes/lote.routes.js";
import kardexRoutes from "./routes/kardex.routes.js";
import consumoRoutes from './routes/consumo.routes.js';
import menuRoutes from './routes/menu.routes.js';
import planillaRoutes from './routes/planilla.routes.js';
import sectorRoutes from './routes/sector.routes.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// CONECTAR LAS RUTAS EN EXPRESS
app.use('/api/usuarios', usuarioRoutes); // 🎯 NUEVO: Endpoint para Login y Registro
app.use('/api/productos', productoRoutes);
app.use('/api/lotes', loteRoutes);
app.use('/api/kardex', kardexRoutes);
app.use('/api/consumos', consumoRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/planillas', planillaRoutes);
app.use('/api/sectores', sectorRoutes);

const PORT = process.env.PORT || 3001;

// Verificar conexión e iniciar servidor
async function main() {
    try {
        await sequelize.authenticate();
        console.log("CONEXION EXITOSA A POSTGRES");

        await sequelize.sync({ alter: true });
        console.log("BASE DE DATOS SINCRONIZADA CON DIRECTIVAS DE SEGURIDAD");

        app.listen(PORT, () => {
            console.log(`SERVIDOR CORRIENDO EN EL PUERTO: ${PORT}`);
        });
    } catch (error) {
        console.error("ERROR CRITICO AL INICIAR EL SERVIDOR:", error);
    }
}

main();