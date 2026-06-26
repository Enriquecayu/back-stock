import Producto from './Producto.js';
import LoteStock from './LoteStock.js';
import Kardex from './Kardex.js';
import Consumo from './Consumo.js';
import Menu from './Menu.js';
import MenuIngrediente from './MenuIngrediente.js';
import PlanillaRacion from './PlanillaRacion.js';
import Usuario from './Usuario.js'; // 🎯 Importamos el nuevo modelo de usuarios
import SectorDestinatario from './SectorDestinatario.js'; // 👈 1. IMPORTAMOS EL NUEVO MODELO

// DEFINICIÓN DE ASOCIACIONES (RELACIONES)

// Relación Producto <-> LoteStock (1:N)
Producto.hasMany(LoteStock, { foreignKey: 'idProducto', as: 'lotes', onDelete: 'RESTRICT' });
LoteStock.belongsTo(Producto, { foreignKey: 'idProducto', as: 'producto' });

// Relación LoteStock <-> Kardex (1:N)
LoteStock.hasMany(Kardex, { foreignKey: 'idLote', as: 'movimientos', onDelete: 'RESTRICT' });
Kardex.belongsTo(LoteStock, { foreignKey: 'idLote', as: 'lote' });

// Relación Producto <-> Consumo
Producto.hasMany(Consumo, { foreignKey: 'idProducto', as: 'consumos' });
Consumo.belongsTo(Producto, { foreignKey: 'idProducto', as: 'producto' });

// --- RELACIONES DE MENÚS Y RECETAS ---

// Un Menú tiene muchos ingredientes en su receta
Menu.hasMany(MenuIngrediente, { foreignKey: 'idMenu', as: 'ingredientes' });
MenuIngrediente.belongsTo(Menu, { foreignKey: 'idMenu', as: 'menu' });

// Un ingrediente de la receta pertenece a un Producto de tu stock general
Producto.hasMany(MenuIngrediente, { foreignKey: 'idProducto', as: 'enRecetas' });
MenuIngrediente.belongsTo(Producto, { foreignKey: 'idProducto', as: 'producto' });

// --- RELACIÓN DE LA PLANILLA DIARIA ---
// Una planilla diaria de cocina pertenece a un Menú (receta) de tu catálogo
Menu.hasMany(PlanillaRacion, { foreignKey: 'idMenu', as: 'planillas' });
PlanillaRacion.belongsTo(Menu, { foreignKey: 'idMenu', as: 'menu' });

// --- 🔒 NUEVAS RELACIONES DE SEGURIDAD Y ROLES ---

// Un Usuario (Administrador o Cocinera) puede registrar muchas planillas de raciones diarias
Usuario.hasMany(PlanillaRacion, { foreignKey: 'idUsuario', as: 'racionesRegistradas' });
PlanillaRacion.belongsTo(Usuario, { foreignKey: 'idUsuario', as: 'usuario' });

// Un Usuario puede asentar muchos consumos globales en el sistema
Usuario.hasMany(Consumo, { foreignKey: 'idUsuario', as: 'consumosRegistrados' });
Consumo.belongsTo(Usuario, { foreignKey: 'idUsuario', as: 'usuario' });

// --- 🏥 2. NUEVA RELACIÓN DEL CATÁLOGO DE SECTORES (Opción C) ---
// Un sector (ej: "Pediatría") puede aparecer en muchas planillas diarias
SectorDestinatario.hasMany(PlanillaRacion, { foreignKey: 'idSector', as: 'planillas', onDelete: 'RESTRICT' });
PlanillaRacion.belongsTo(SectorDestinatario, { foreignKey: 'idSector', as: 'sector' });


// Exportamos todos los modelos agrupados y listos
export {
    Producto,
    LoteStock,
    Kardex,
    Consumo,
    Menu,
    MenuIngrediente,
    PlanillaRacion,
    Usuario,
    SectorDestinatario // 👈 3. EXPORTAMOS EL MODELO
};