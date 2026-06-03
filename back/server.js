import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';
// 🎯 MODIFICADO: Ya no importamos RegistroRacion
import { Producto, LoteStock, Kardex, PlanillaRacion, Consumo, Menu, MenuIngrediente } from "./models/index.js";

// IMPORT DE RUTAS (🎯 MODIFICADO: Eliminamos la línea de racion.routes.js)
import productoRoutes from './routes/producto.routes.js';
import loteRoutes from "./routes/lote.routes.js";
import kardexRoutes from "./routes/kardex.routes.js";
import consumoRoutes from './routes/consumo.routes.js';
import menuRoutes from './routes/menu.routes.js';
import planillaRoutes from './routes/planilla.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// CONECTAR LAS RUTAS EN EXPRESS (🎯 MODIFICADO: Eliminamos la ruta /api/raciones)
app.use('/api/productos', productoRoutes);
app.use('/api/lotes', loteRoutes);
app.use('/api/kardex', kardexRoutes);
app.use('/api/consumos', consumoRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/planillas', planillaRoutes);

const PORT = process.env.PORT || 3001;

// Verificar conexión e iniciar servidor
async function main() {
    try {
        await sequelize.authenticate();
        console.log("CONEXION EXITOSA A POSTGRES");

        // 🎯 MODIFICADO: Volvemos a 'alter: true' porque el force ya limpió los esquemas viejos.
        // De esta forma, tus nuevos productos, lotes y recetas no se borrarán al reiniciar nodemon.
        await sequelize.sync({ alter: true });
        console.log("TABLAS SINCRONIZADAS CON PG");

        app.listen(PORT, () => {
            console.log(`SERVIDOR CORRIENDO EN http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("ERROR AL SINCRONIZAR", error);
    }
}

main();