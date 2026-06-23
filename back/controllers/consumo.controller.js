import sequelize from '../config/database.js';
import { Consumo, LoteStock, Producto, Kardex, Usuario } from '../models/index.js';
import { Op } from 'sequelize';

// 1. REGISTRAR UN NUEVO CONSUMO (Salida de stock con algoritmo FIFO)
export const createConsumo = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { idProducto, cantidadTotal, detalle } = req.body;

        // 🎯 EXTRACCIÓN ULTRA SEGURA: Obtenemos el ID del usuario logueado desde el Token JWT
        const idUsuarioLogueado = req.usuario.id;

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

        // 4. Calcular stock total disponible
        const stockTotalDisponible = lotesDisponibles.reduce((suma, l) => suma + parseFloat(l.cantidadActual), 0);

        if (stockTotalDisponible < cantidadRequerida) {
            await t.rollback();
            return res.status(400).json({
                mensaje: `Stock insuficiente para realizar el consumo de "${producto.nombre}". Requerido: ${cantidadRequerida}, Disponible: ${stockTotalDisponible}.`
            });
        }

        // 5. Crear el registro en la tabla consumos firmando digitalmente con idUsuario
        const nuevoConsumo = await Consumo.create({
            idProducto,
            idUsuario: idUsuarioLogueado, // 🎯 Asignamos el usuario responsable
            cantidadTotal,
            detalle: detalle || 'Salida manual de stock'
        }, { transaction: t });

        // 6. Algoritmo FIFO: Ir descontando lote por lote
        let cantidadRestante = cantidadRequerida;

        for (const lote of lotesDisponibles) {
            if (cantidadRestante <= 0) break;

            const stockLote = parseFloat(lote.cantidadActual);
            let cantidadA_Descontar = 0;

            if (stockLote >= cantidadRestante) {
                cantidadA_Descontar = cantidadRestante;
                lote.cantidadActual = stockLote - cantidadA_Descontar;
                cantidadRestante = 0;
            } else {
                cantidadA_Descontar = stockLote;
                lote.cantidadActual = 0;
                cantidadRestante -= cantidadA_Descontar;
            }

            // Guardamos el cambio de stock en el lote actual
            await lote.save({ transaction: t });

            // 7. Registrar cada movimiento en el Kardex asociándolo al lote de origen
            await Kardex.create({
                idLote: lote.id,
                tipoMovimiento: 'Salida',
                cantidad: cantidadA_Descontar,
                precioUnitarioHistorico: lote.precioUnitario,
                fechaMovimiento: new Date(),
                detalle: `Consumo Ref #${nuevoConsumo.id}: ${nuevoConsumo.detalle} (Por usuario ID: ${idUsuarioLogueado})`
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

// 2. OBTENER EL HISTORIAL DE CONSUMOS GLOBALES (Con datos de quién cargó)
export const getConsumos = async (req, res) => {
    try {
        const consumos = await Consumo.findAll({
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['nombre', 'unidadMedida', 'categoria']
                },
                {
                    model: Usuario, // 🎯 Permite ver qué cocinera o admin hizo el consumo directo
                    as: 'usuario',
                    attributes: ['nombreCompleto', 'rol']
                }
            ],
            order: [['fechaConsumo', 'DESC']]
        });
        return res.status(200).json(consumos);
    } catch (error) {
        console.error('Error al traer consumos:', error);
        return res.status(500).json({ mensaje: 'Error al obtener la lista de consumos.' });
    }
};