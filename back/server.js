import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';
import { Producto, RegistroRacion, LoteStock, Kardex } from "./models/index.js";
//IMPORT DE RUTAS
import productoRoutes from './routes/producto.routes.js';
import loteRoutes from "./routes/lote.routes.js";
import racionRoutes from "./routes/racion.routes.js";
import kardexRoutes from "./routes/kardex.routes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

//CONECTAR LAS RUTAS EN EXPRESS
app.use('/api/productos', productoRoutes);
app.use('/api/lotes', loteRoutes);
app.use('/api/raciones', racionRoutes);
app.use('/api/kardex', kardexRoutes);
const PORT = process.env.PORT || 3001;

// Verificar conexión e iniciar servidor
async function main() {
    try {
        await sequelize.authenticate();
        console.log("CONEXION EXITOSA A POSTGRES");
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