import Producto from './Producto.js';
import LoteStock from './LoteStock.js';
import RegistroRacion from './RegistroRacion.js';
import Kardex from './Kardex.js';
import Consumo from './Consumo.js';
import Menu from './Menu.js';
import MenuIngrediente from './MenuIngrediente.js';
import PlanillaRacion from './PlanillaRacion.js';

// DEFINICIÓN DE ASOCIACIONES (RELACIONES)

// Relación Producto <-> LoteStock (1:N)
// onDelete: 'RESTRICT' impide borrar el producto si tiene lotes asociados
Producto.hasMany(LoteStock, { foreignKey: 'idProducto', as: 'lotes', onDelete: 'RESTRICT' });
LoteStock.belongsTo(Producto, { foreignKey: 'idProducto', as: 'producto' });

// Relación LoteStock <-> Kardex (1:N)
// onDelete: 'RESTRICT' impide borrar un lote si ya tiene movimientos en el historial del Kardex
LoteStock.hasMany(Kardex, { foreignKey: 'idLote', as: 'movimientos', onDelete: 'RESTRICT' });
Kardex.belongsTo(LoteStock, { foreignKey: 'idLote', as: 'lote' });

// Relación Producto <-> Consumo
Producto.hasMany(Consumo, { foreignKey: 'idProducto', as: 'consumos' });
Consumo.belongsTo(Producto, { foreignKey: 'idProducto', as: 'producto' });

// --- RELACIONES DE MENÚS Y RECETAS ---

// Un Menú (Guiso de Arroz) tiene muchos ingredientes en su receta
Menu.hasMany(MenuIngrediente, { foreignKey: 'idMenu', as: 'ingredientes' });
MenuIngrediente.belongsTo(Menu, { foreignKey: 'idMenu', as: 'menu' });

// Un ingrediente de la receta pertenece a un Producto de tu stock general
Producto.hasMany(MenuIngrediente, { foreignKey: 'idProducto', as: 'enRecetas' });
MenuIngrediente.belongsTo(Producto, { foreignKey: 'idProducto', as: 'producto' });

// --- RELACIÓN DE LA PLANILLA DIARIA ---
// Una planilla diaria de cocina pertenece a un Menú (receta) de tu catálogo
Menu.hasMany(PlanillaRacion, { foreignKey: 'idMenu', as: 'historialCocina' });
PlanillaRacion.belongsTo(Menu, { foreignKey: 'idMenu', as: 'menu' });

// Exportamos todos los modelos unificados
export {
    Producto,
    LoteStock,
    RegistroRacion,
    Kardex,
    Consumo,
    Menu,
    MenuIngrediente,
    PlanillaRacion
};