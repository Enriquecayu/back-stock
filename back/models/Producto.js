import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Producto = sequelize.define('Producto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true
    },
    categoria: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    unidadMedida: {
        type: DataTypes.STRING(50),
        allowNull: false 
    },
    stockMinimo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    }
}, {
    tableName: 'productos'
});

export default Producto;