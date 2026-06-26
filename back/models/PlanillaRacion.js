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
    idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false // Toda ración diaria debe tener el responsable que cocinó
    },
    fecha: {
        type: DataTypes.DATEONLY, // Guarda solo la fecha (AAAA-MM-DD) sin la hora
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    turno: {
        type: DataTypes.ENUM('D', 'A', 'M', 'C'), // D: Desayuno, A: Almuerzo, M: Merienda, C: Cena
        allowNull: false
    },
    tipoDestinatario: {
        type: DataTypes.STRING(100),
        allowNull: true // 👈 CAMBIADO A TRUE: Clave para que Sequelize permita omitirlo en las nuevas planillas
    },
    idSector: {
        type: DataTypes.INTEGER,
        allowNull: false, // 🛡️ OBLIGATORIO: Toda nueva planilla debe apuntar a un ID del catálogo de sectores
        references: {
            model: 'sectores_destinatarios', // Nombre físico de la tabla maestra en la base de datos
            key: 'id'
        }
    },
    cantidadRaciones: {
        type: DataTypes.INTEGER,
        allowNull: false // Cuántos pacientes o internos comieron ese día
    },
    observaciones: {
        type: DataTypes.STRING(255),
        allowNull: true // Opcional para notas de la jornada
    }
}, {
    tableName: 'planilla_raciones',
    timestamps: true // Nos guarda automáticamente el createdAt y updatedAt para auditoría
});

export default PlanillaRacion;