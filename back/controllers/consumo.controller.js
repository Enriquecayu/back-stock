import sequelize from '../config/database.js';
import { Consumo, LoteStock, Producto, Kardex } from '../models/index.js';
import { Op } from 'sequelize';

// 1. REGISTRAR UN NUEVO CONSUMO (Salida de stock con algoritmo FIFO)
export const createConsumo = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { idProducto, cantidadTotal, detalle } = req.body;

        // 🛡️ Validación 1: Campos obligatorios y lógica de cantidades
        if (!idProducto || cantidadTotal === undefined || parseFloat(cantidadTotal) <= 0) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios o la cantidad es inválida.' });
        }

        // 🛡️ Validación 2: Verificar existencia del producto
        const producto = await Producto.findByPk(idProducto, { transaction: t });
        if (!producto) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'El producto especificado no existe.' });
        }

        const cantidadRequerida = parseFloat(cantidadTotal);

        // 3. Buscar lotes disponibles con stock activo (> 0) ordenados por vencimiento (FIFO)
        const lotesDisponibles = await LoteStock.findAll({
            where: {
                idProducto,
                cantidadActual: { [Op.gt]: 0 }
            },
            order: [['fechaVencimiento', 'ASC']],
            transaction: t
        });

        // 4. Calcular el stock total consolidado en el depósito
        const stockTotal = lotesDisponibles.reduce((sum, lote) => sum + parseFloat(lote.cantidadActual), 0);

        // 🛡️ Validación 3: Control de existencias totales antes de tocar nada
        if (stockTotal < cantidadRequerida) {
            await t.rollback();
            return res.status(400).json({
                mensaje: `Stock insuficiente. Solicitado: ${cantidadRequerida} ${producto.unidadMedida}, Disponible: ${stockTotal} ${producto.unidadMedida}`
            });
        }

        // 5. Crear el registro "Maestro" del Consumo
        const nuevoConsumo = await Consumo.create({
            idProducto,
            cantidadTotal: cantidadRequerida,
            detalle: detalle?.trim() || 'Salida por consumo regular de cocina',
            fechaConsumo: new Date()
        }, { transaction: t });

        let cantidadPendiente = cantidadRequerida;

        // 6. Bucle FIFO en cascada para ir vaciando/restando lotes
        for (let lote of lotesDisponibles) {
            if (cantidadPendiente <= 0) break;

            let stockEnLote = parseFloat(lote.cantidadActual);
            let cantidadADescontar = 0;

            if (stockEnLote >= cantidadPendiente) {
                // Caso A: El lote actual tiene suficiente o justo lo que falta
                cantidadADescontar = cantidadPendiente;
                lote.cantidadActual = parseFloat((stockEnLote - cantidadPendiente).toFixed(2));
                cantidadPendiente = 0;
            } else {
                // Caso B: El lote no alcanza solo. Se vacía y el saldo pasa al próximo lote
                cantidadADescontar = stockEnLote;
                cantidadPendiente = parseFloat((cantidadPendiente - stockEnLote).toFixed(2));
                lote.cantidadActual = 0;
            }

            // Guardamos el lote modificado dentro de la transacción
            await lote.save({ transaction: t });

            // Insertamos la línea detallada en el Kardex para la auditoría física del lote
            await Kardex.create({
                idLote: lote.id,
                tipoMovimiento: 'Salida',
                cantidad: cantidadADescontar,
                precioUnitarioHistorico: lote.precioUnitario,
                fechaMovimiento: new Date(),
                detalle: `Consumo Ref #${nuevoConsumo.id}: ${nuevoConsumo.detalle}`
            }, { transaction: t });
        }

        // Si todo salió perfecto, confirmamos definitivamente los cambios en PostgreSQL
        await t.commit();

        return res.status(201).json({
            mensaje: 'Consumo procesado con éxito y stock actualizado.',
            consumo: nuevoConsumo
        });

    } catch (error) {
        // Si saltó cualquier error, el rollback resguarda la base de datos intacta
        await t.rollback();
        console.error('Error al procesar el consumo FIFO:', error);
        return res.status(500).json({ mensaje: 'Error interno al registrar el consumo.' });
    }
};

// 2. OBTENER EL HISTORIAL DE CONSUMOS GLOBALES (Opcional, útil para listados limpios)
export const getConsumos = async (req, res) => {
    try {
        const consumos = await Consumo.findAll({
            include: [{
                model: Producto,
                as: 'producto',
                attributes: ['nombre', 'unidadMedida', 'categoria']
            }],
            order: [['fechaConsumo', 'DESC']]
        });
        return res.status(200).json(consumos);
    } catch (error) {
        console.error('Error al traer consumos:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el historial de consumos.' });
    }
};