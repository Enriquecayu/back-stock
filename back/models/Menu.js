import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Menu = sequelize.define('Menu', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true // No permite dos recetas con el mismo nombre (ej: "Guiso de Arroz")
    },
    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true // Opcional, por si quieren poner "Dieta liviana" o "Para pabellón A"
    }
}, {
    tableName: 'menus',
    timestamps: true // Nos guarda automáticamente cuándo se creó la receta
});

export default Menu;