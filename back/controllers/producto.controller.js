import { Op } from 'sequelize';
import { Producto, LoteStock } from '../models/index.js';
import sequelize from '../config/database.js';

// 1. OBTENER TODOS LOS PRODUCTOS
export const getProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll({
            attributes: [
                'id',
                'nombre',
                'categoria',
                'unidadMedida',
                'stockMinimo',
                [
                    sequelize.fn('COUNT', sequelize.col('lotes.id')),
                    'totalLotes'
                ]
            ],
            include: [{
                model: LoteStock,
                as: 'lotes',
                attributes: []
            }],
            group: ['Producto.id'], 
            order: [['nombre', 'ASC']] 
        });

        return res.status(200).json(productos);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el catálogo.' });
    }
};

// 2. CREAR UN NUEVO PRODUCTO
export const createProducto = async (req, res) => {
    try {
        const { nombre, categoria, unidadMedida, stockMinimo } = req.body;

        if (!nombre || !categoria || !unidadMedida) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
        }

        const nombreLimpio = nombre.trim();

        const productoExiste = await Producto.findOne({
            where: {
                nombre: {
                    [Op.iLike]: nombreLimpio
                }
            }
        });

        if (productoExiste) {
            return res.status(400).json({
                mensaje: `El producto "${nombreLimpio}" ya está registrado en el catálogo.`
            });
        }

        const nuevoProducto = await Producto.create({
            nombre,
            categoria,
            unidadMedida,
            stockMinimo: stockMinimo || 0.00
        });

        return res.status(201).json({
            mensaje: 'Producto creado con éxito',
            producto: nuevoProducto
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        return res.status(500).json({ mensaje: 'Error al registrar el producto.' });
    }
};

// 3. ACTUALIZAR UN PRODUCTO (PUT)
export const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, categoria, stockMinimo } = req.body;

        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }

        producto.nombre = nombre || producto.nombre;
        producto.categoria = categoria || producto.categoria;
        producto.stockMinimo = stockMinimo !== undefined ? stockMinimo : producto.stockMinimo;

        await producto.save();

        return res.status(200).json({ mensaje: 'Producto actualizado con éxito', producto });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        return res.status(500).json({ mensaje: 'Error al actualizar el producto.' });
    }
};

// 4. ELIMINAR UN PRODUCTO (DELETE)
export const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }

        await producto.destroy();

        return res.status(200).json({ mensaje: 'Producto eliminado con éxito.' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        return res.status(500).json({
            mensaje: 'No se puede eliminar el producto porque está asociado a lotes activos o movimientos de stock.'
        });
    }
};