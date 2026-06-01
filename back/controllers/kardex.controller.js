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

// 3. REGISTRAR SALIDA DE MERCADERÍA (ALGORITMO FIFO AUTOMÁTICO CON CONTROL DE DECIMALES)
export const registrarSalidaFIFO = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { idProducto, cantidadAsacar, detalle } = req.body;

        // 🛡️ Validación 1: Campos obligatorios y lógica de cantidades
        if (!idProducto || cantidadAsacar === undefined || Number(cantidadAsacar) <= 0) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios o la cantidad es inválida.' });
        }

        // 🛡️ Validación 2: Verificar existencia real del producto antes de operar
        const producto = await Producto.findByPk(idProducto, { transaction: t });
        if (!producto) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'No se puede procesar la salida. El producto no existe.' });
        }

        const cantidadRequerida = parseFloat(cantidadAsacar);

        // 3. Buscar todos los lotes de este producto con stock
        const lotesDisponibles = await LoteStock.findAll({
            where: {
                idProducto,
                cantidadActual: { [Op.gt]: 0 }
            },
            order: [['fechaVencimiento', 'ASC']], // FIFO estricto por vencimiento
            transaction: t
        });

        // 4. Calcular el stock total consolidado
        const stockTotal = lotesDisponibles.reduce((sum, lote) => sum + parseFloat(lote.cantidadActual), 0);

        // 🛡️ Validación 3: Control de existencias totales
        if (stockTotal < cantidadRequerida) {
            await t.rollback();
            return res.status(400).json({
                mensaje: `Stock insuficiente en depósito. Solicitado: ${cantidadRequerida}, Disponible total: ${stockTotal}`
            });
        }

        let cantidadPendiente = cantidadRequerida;

        // 5. Bucle FIFO
        for (let lote of lotesDisponibles) {
            if (cantidadPendiente <= 0) break;

            let stockEnLote = parseFloat(lote.cantidadActual);
            let cantidadADescontarDeEsteLote = 0;

            if (stockEnLote >= cantidadPendiente) {
                // CASO A: El lote cubre la necesidad actual
                cantidadADescontarDeEsteLote = cantidadPendiente;
                // 🛡️ .toFixed(2) evita errores de redondeo de coma flotante de JavaScript
                lote.cantidadActual = parseFloat((stockEnLote - cantidadPendiente).toFixed(2));
                cantidadPendiente = 0;
            } else {
                // CASO B: El lote no alcanza solo. Se vacía y el saldo pasa al siguiente
                cantidadADescontarDeEsteLote = stockEnLote;
                cantidadPendiente = parseFloat((cantidadPendiente - stockEnLote).toFixed(2));
                lote.cantidadActual = 0;
            }

            // Guardamos el lote modificado en la transacción
            await lote.save({ transaction: t });

            // Registramos el movimiento en el Kardex asociándolo a tu modelo
            await Kardex.create({
                idLote: lote.id,
                tipoMovimiento: 'Salida',
                cantidad: cantidadADescontarDeEsteLote,
                precioUnitarioHistorico: lote.precioUnitario, // Congela el precio del lote
                fechaMovimiento: new Date(), // Sincroniza con la hora exacta local
                detalle: detalle?.trim() || 'Salida por consumo de cocina'
            }, { transaction: t });
        }

        // Confirmamos de manera definitiva la transacción en la BD
        await t.commit();

        return res.status(201).json({
            mensaje: `Salida de stock procesada con éxito usando algoritmo FIFO. Se descontaron ${cantidadRequerida} unidades.`
        });

    } catch (error) {
        // Escudo protector ante caídas: revierte cualquier cambio intermedio
        await t.rollback();
        console.error('Error en salida FIFO:', error);
        return res.status(500).json({ mensaje: 'Error interno al procesar la salida de stock.' });
    }
};