import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import LoteStock from './LoteStock.js'; // Lo vinculamos al lote específico

const Kardex = sequelize.define('Kardex', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idLote: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: LoteStock,
            key: 'id'
        }
    },
    tipoMovimiento: {
        type: DataTypes.ENUM('Entrada', 'Salida', 'Ajuste_Positivo', 'Ajuste_Negativo'),
        allowNull: false
        // Entrada: Compra o donación / Salida: Cocina de raciones
        // Ajustes: Por si se rompe un envase o vence un producto
    },
    cantidad: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false // Cantidad que se mueve en esta operación
    },
    precioUnitarioHistorico: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false // El precio en pesos al momento de hacer este movimiento (clave para la inflación)
    },
    fechaMovimiento: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW // Guarda el día y la hora exacta del movimiento automáticamente
    },
    detalle: {
        type: DataTypes.STRING(255),
        allowNull: true // Ej: "Consumo para Almuerzo - Dieta", "Remito N° 4022", "Baja por vencimiento"
    }
}, {
    tableName: 'kardex'
});

export default Kardex;