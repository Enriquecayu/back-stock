import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SectorDestinatario = sequelize.define('SectorDestinatario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // 🛡️ Impide que la admin duplique el mismo sector por error
        validate: {
            notEmpty: true
        }
    }
}, {
    tableName: 'sectores_destinatarios',
    timestamps: true // Te guarda automáticamente createdAt y updatedAt
});

export default SectorDestinatario;