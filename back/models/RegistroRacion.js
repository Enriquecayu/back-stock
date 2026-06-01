import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RegistroRacion = sequelize.define('RegistroRacion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    turno: {
        type: DataTypes.ENUM('D', 'A', 'M', 'C'),
        allowNull: false
    },
    tipoDestinatario: {
        type: DataTypes.ENUM('Normal', 'Dieta', 'Acompañante', 'Personal'),
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    observaciones: { 
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'registro_raciones',
    timestamps: true,
    paranoid: true
});

export default RegistroRacion;