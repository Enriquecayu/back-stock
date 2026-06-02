import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PlanillaRacion = sequelize.define('PlanillaRacion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idMenu: {
        type: DataTypes.INTEGER,
        allowNull: false // ID del plato que la encargada eligió cocinar
    },
    fecha: {
        type: DataTypes.DATEONLY, // Guarda solo la fecha (AAAA-MM-DD) sin la hora, ideal para balances diarios
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    cantidadRaciones: {
        type: DataTypes.INTEGER,
        allowNull: false // Cuántos pacientes o internos comieron ese día
    },
    observaciones: {
        type: DataTypes.STRING(255),
        allowNull: true // Opcional, por si quieren poner una nota (ej: "Se cocinó de más por guardias de refuerzo")
    }
}, {
    tableName: 'planilla_raciones',
    timestamps: true // Nos guarda automáticamente el createdAt y updatedAt para auditoría
});

export default PlanillaRacion;