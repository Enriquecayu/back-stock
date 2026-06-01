import Producto from './Producto.js';
import LoteStock from './LoteStock.js';
import RegistroRacion from './RegistroRacion.js';
import Kardex from './Kardex.js';

// DEFINICIÓN DE ASOCIACIONES (RELACIONES)

// Relación Producto <-> LoteStock (1:N)
// onDelete: 'RESTRICT' impide borrar el producto si tiene lotes asociados
Producto.hasMany(LoteStock, { foreignKey: 'idProducto', as: 'lotes', onDelete: 'RESTRICT' });
LoteStock.belongsTo(Producto, { foreignKey: 'idProducto', as: 'producto' });

// Relación LoteStock <-> Kardex (1:N)
// onDelete: 'RESTRICT' impide borrar un lote si ya tiene movimientos en el historial del Kardex
LoteStock.hasMany(Kardex, { foreignKey: 'idLote', as: 'movimientos', onDelete: 'RESTRICT' });
Kardex.belongsTo(LoteStock, { foreignKey: 'idLote', as: 'lote' });

// Exportamos todos los modelos unificados
export {
    Producto,
    LoteStock,
    RegistroRacion,
    Kardex
};