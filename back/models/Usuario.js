import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombreCompleto: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true // Evita que existan dos usuarios con el mismo nombre de inicio de sesión
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false // Acá vas a guardar el hash encriptado con bcrypt más adelante
    },
    rol: {
        type: DataTypes.ENUM('Administrador', 'Cocinera'),
        allowNull: false,
        defaultValue: 'Cocinera' // Si se crea un usuario sin especificar, toma el rol de menor privilegio por seguridad
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true // Permite dar de baja un usuario sin borrar su historial
    }
}, {
    tableName: 'usuarios',
    timestamps: true // Nos crea automáticamente createdAt y updatedAt
});

export default Usuario;