import sequelize from '../config/database.js';
import { Kardex, LoteStock, Producto } from '../models/index.js';
import { Op } from 'sequelize';

// 1. OBTENER TODO EL HISTORIAL GENERAL DEL KARDEX
export const getKardex = async (req, res) => {
    try {
        const movimientos = await Kardex.findAll({
            include: [{
                model: LoteStock,
                as: 'lote',
                include: [{
                    model: Producto,
                    as: 'producto',
                    attributes: ['nombre', 'unidadMedida']
                }]
            }],
            order: [['fechaMovimiento', 'DESC']] // Usamos tu campo del modelo
        });
        return res.status(200).json(movimientos);
    } catch (error) {
        console.error('Error al obtener Kardex:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el historial de movimientos.' });
    }
};

// 2. OBTENER HISTORIAL DE KARDEX FILTRADO POR PRODUCTO (Clave para reportes en React)
export const getKardexPorProducto = async (req, res) => {
    try {
        const { idProducto } = req.params;

        // Verificamos primero si el producto existe
        const productoExiste = await Producto.findByPk(idProducto);
        if (!productoExiste) {
            return res.status(404).json({ mensaje: 'El producto especificado no existe.' });
        }

        const movimientos = await Kardex.findAll({
            include: [{
                model: LoteStock,
                as: 'lote',
                where: { idProducto }, // 🎯 Filtra los lotes que pertenecen a este producto
                include: [{
                    model: Producto,
                    as: 'producto',
                    attributes: ['nombre', 'unidadMedida']
                }]
            }],
            order: [['fechaMovimiento', 'DESC']]
        });

        return res.status(200).json(movimientos);
    } catch (error) {
        console.error('Error al obtener Kardex por producto:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el historial del producto.' });
    }
};