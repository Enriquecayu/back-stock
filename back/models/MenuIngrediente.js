import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MenuIngrediente = sequelize.define('MenuIngrediente', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idMenu: {
        type: DataTypes.INTEGER,
        allowNull: false // ID del menú al que pertenece esta línea de receta
    },
    idProducto: {
        type: DataTypes.INTEGER,
        allowNull: false // El insumo de tu inventario general (ej: el ID de la Azúcar o Arroz)
    },
    cantidadPorPersona: {
        type: DataTypes.DECIMAL(10, 4), // Guardamos con 4 decimales por si son gramos chicos (ej: 0.0500 kg)
        allowNull: false
    }
}, {
    tableName: 'menu_ingredientes',
    timestamps: false // No hace falta guardar fecha en esta tabla intermedia
});

export default MenuIngrediente;
