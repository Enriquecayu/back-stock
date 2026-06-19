import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Consumo = sequelize.define('Consumo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idProducto: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cantidadTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    fechaConsumo: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    detalle: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false // Todo consumo debe ser cargado por alguien logueado
    },
}, {
    tableName: 'consumos',
    timestamps: true // Te crea createdAt y updatedAt automáticamente
});

export default Consumo;