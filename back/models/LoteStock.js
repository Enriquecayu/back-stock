import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Producto from './Producto.js';

const LoteStock = sequelize.define('LoteStock', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idProducto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Producto,
            key: 'id'
        }
    },
    numeroLote: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    cantidadInicial: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    cantidadActual: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    fechaVencimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    }
}, {
    tableName: 'lotes_stock'
});

export default LoteStock;