import sequelize from '../config/database.js'; // 🎯 Agregado para soportar transacciones
import { LoteStock, Producto, Kardex } from '../models/index.js'; // 🎯 Sumamos Kardex a las importaciones

// 1. OBTENER LOTES (Soporta ver todos O filtrar por producto usando Query Params)
export const getLotes = async (req, res) => {
    try {
        // Capturamos el idProducto si es que viene en la URL (?idProducto=X)
        const { idProducto } = req.query;

        // Creamos un objeto de condiciones vacío
        let condiciones = {};

        // Si el frontend mandó el id de un producto, le agregamos el filtro al WHERE
        if (idProducto) {
            condiciones.idProducto = idProducto;
        }

        const lotes = await LoteStock.findAll({
            where: condiciones, // Si está vacío, Sequelize ignora el WHERE y trae todo
            include: [{
                model: Producto,
                as: 'producto',
                attributes: ['nombre', 'categoria', 'unidadMedida']
            }],
            order: [['fechaVencimiento', 'ASC']] // FIFO estricto para el hospital
        });

        return res.status(200).json(lotes);
    } catch (error) {
        console.error('Error al obtener lotes:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el listado de lotes.' });
    }
};

// 2. REGISTRAR UN NUEVO LOTE (Ingreso de mercadería + Registro Automático en Kardex)
export const createLote = async (req, res) => {
    // 🛡️ Abrimos una transacción para blindar la operación síncrona
    const t = await sequelize.transaction();

    try {
        const { idProducto, numeroLote, cantidadInicial, fechaVencimiento, precioUnitario } = req.body;

        // Validamos campos obligatorios
        if (!idProducto || !cantidadInicial || !fechaVencimiento || !precioUnitario) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios para el lote.' });
        }

        // Verificamos si el producto ("el estante") existe
        const productoExiste = await Producto.findByPk(idProducto, { transaction: t });
        if (!productoExiste) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'El producto especificado no existe.' });
        }

        // Creamos el lote de stock
        const nuevoLote = await LoteStock.create({
            idProducto,
            numeroLote: numeroLote?.trim() || `LOTE-${Date.now()}`, // Fallback si viene vacío
            cantidadInicial,
            cantidadActual: cantidadInicial,
            fechaVencimiento,
            precioUnitario
        }, { transaction: t });

        // 🎯 INCORPORACIÓN CLAVE: Insertamos la línea de Entrada en la bitácora del Kardex
        await Kardex.create({
            idLote: nuevoLote.id,
            tipoMovimiento: 'Entrada', // 📥 Indica que ingresa stock
            cantidad: parseFloat(cantidadInicial),
            precioUnitarioHistorico: parseFloat(precioUnitario),
            fechaMovimiento: new Date(),
            detalle: `Ingreso inicial de mercadería - Lote Nº ${nuevoLote.numeroLote}`
        }, { transaction: t });

        // Si ambos inserts se ejecutaron de 10, confirmamos los cambios de forma permanente
        await t.commit();

        return res.status(201).json({
            mensaje: 'Lote registrado con éxito y asentado en el Kardex.',
            lote: nuevoLote
        });
    } catch (error) {
        // Ante cualquier problema intermedio, revertimos todo para no corromper el stock
        await t.rollback();
        console.error('Error al crear lote transaccional:', error);
        return res.status(500).json({ mensaje: 'Error al registrar el lote en la base de datos.' });
    }
};

// 3. ACTUALIZAR DATOS DE UN LOTE (Para corregir errores de tipeo)
export const updateLote = async (req, res) => {
    try {
        const { id } = req.params;
        const { numeroLote, fechaVencimiento, precioUnitario } = req.body;

        const lote = await LoteStock.findByPk(id);

        if (!lote) {
            return res.status(404).json({ mensaje: 'Lote no encontrado.' });
        }

        // Permitimos corregir solo estos campos informativos
        lote.numeroLote = numeroLote !== undefined ? numeroLote : lote.numeroLote;
        lote.fechaVencimiento = fechaVencimiento || lote.fechaVencimiento;
        lote.precioUnitario = precioUnitario !== undefined ? precioUnitario : lote.precioUnitario;

        await lote.save();

        return res.status(200).json({
            mensaje: 'Lote actualizado con éxito',
            lote
        });
    } catch (error) {
        console.error('Error al actualizar el lote:', error);
        return res.status(500).json({ mensaje: 'Error al modificar los datos del lote.' });
    }
};