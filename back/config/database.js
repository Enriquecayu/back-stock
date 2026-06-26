import { Sequelize } from "sequelize";
import "dotenv/config";

// 🎯 Lógica inteligente: Si existe DATABASE_URL (Render/Neon), la usa.
// Si no, usa las variables individuales (Local).
const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Necesario para Neon/Postgres en la nube
            }
        },
        define: { timestamps: true, underscored: true }
    })
    : new Sequelize({
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres",
        logging: false,
        define: {
            timestamps: true,
            underscored: true,
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });

export default sequelize;