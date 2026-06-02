import sequelize from '../config/database.js';
import { PlanillaRacion, Menu, MenuIngrediente, LoteStock, Kardex, Producto } from '../models/index.js';
import { Op } from 'sequelize';

// 1. PROCESAR PLANILLA DIARIA DE RACIONES CON DESCUENTO FIFO AUTOMÁTICO
export const registrarPlanillaDiaria = async (req, res) => {
    // 🛡️ Abrimos una transacción global. Si falta stock de un solo insumo, se cancela TODA la planilla
    const t = await sequelize.transaction();

    try {
        const { idMenu, cantidadRaciones, observaciones } = req.body;

        // Validaciones iniciales
        if (!idMenu || !cantidadRaciones || parseInt(cantidadRaciones) <= 0) {
            return res.status(400).json({ mensaje: 'Debe especificar un menú válido y una cantidad de raciones mayor a cero.' });
        }

        // Verificar que el menú exista y traer su receta completa con los datos del producto
        const menuConReceta = await Menu.findByPk(idMenu, {
            include: [{
                model: MenuIngrediente,
                as: 'ingredientes',
                include: [{ model: Producto, as: 'producto', attributes: ['nombre', 'unidadMedida'] }]
            }],
            transaction: t
        });

        if (!menuConReceta) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'El menú especificado no existe.' });
        }

        if (!menuConReceta.ingredientes || menuConReceta.ingredientes.length === 0) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'Este menú no tiene ingredientes cargados en su receta. No se puede calcular el consumo.' });
        }

        // Crear el registro maestro de la Planilla Diaria
        const nuevaPlanilla = await PlanillaRacion.create({
            idMenu,
            cantidadRaciones: parseInt(cantidadRaciones),
            observaciones: observaciones?.trim() || null,
            fecha: new Date()
        }, { transaction: t });

        // 🔄 RECORRER CADA INGREDIENTE DE LA RECETA Y APLICAR EL FIFO
        for (const ingrediente of menuConReceta.ingredientes) {

            // Calculamos cuánta mercadería total se necesita para todos los internos
            const cantidadTotalNecesaria = parseFloat(ingrediente.cantidadPorPersona) * parseInt(cantidadRaciones);
            let cantidadPendientePorDescontar = cantidadTotalNecesaria;

            const nombreInsumo = ingrediente.producto?.nombre || `Insumo ID: ${ingrediente.idProducto}`;
            const unidad = ingrediente.producto?.unidadMedida || '';

            // Buscar todos los lotes disponibles de este producto ordenados por fecha de vencimiento (FIFO)
            const lotesDisponibles = await LoteStock.findAll({
                where: {
                    idProducto: ingrediente.idProducto,
                    cantidadActual: { [Op.gt]: 0 }
                },
                order: [['fechaVencimiento', 'ASC']],
                transaction: t
            });

            // Calcular el stock total disponible sumando todos sus lotes
            const stockTotalDisponible = lotesDisponibles.reduce((acc, lote) => acc + parseFloat(lote.cantidadActual), 0);

            // 🚨 VALIDACIÓN CRÍTICA: Si el depósito no tiene suficiente stock total para cubrir la receta, frenamos todo
            if (stockTotalDisponible < cantidadTotalNecesaria) {
                await t.rollback();
                return res.status(400).json({
                    mensaje: `Stock insuficiente en depósito para el insumo: "${nombreInsumo}". Se necesitan ${cantidadTotalNecesaria.toFixed(2)} ${unidad} pero solo hay ${stockTotalDisponible.toFixed(2)} ${unidad} en total.`
                });
            }

            // Algoritmo de descuento lote por lote (FIFO estricto)
            for (const lote of lotesDisponibles) {
                if (cantidadPendientePorDescontar <= 0) break;

                const stockLote = parseFloat(lote.cantidadActual);
                let cantidadADescontarDeEsteLote = 0;

                if (stockLote >= cantidadPendientePorDescontar) {
                    // Caso A: Al lote le alcanza para cubrir lo que falta
                    cantidadADescontarDeEsteLote = cantidadPendientePorDescontar;
                    lote.cantidadActual = stockLote - cantidadPendientePorDescontar;
                    cantidadPendientePorDescontar = 0; // 🎯 CORREGIDO: Eliminada la variable fantasma en inglés
                } else {
                    // Caso B: El lote no alcanza, se vacía a 0 y pasa al siguiente lote
                    cantidadADescontarDeEsteLote = stockLote;
                    cantidadPendientePorDescontar -= stockLote;
                    lote.cantidadActual = 0;
                }

                // Guardamos el cambio de stock en el lote
                await lote.save({ transaction: t });

                // 🎯 Registramos el movimiento de SALIDA en el Kardex de Auditoría
                await Kardex.create({
                    idLote: lote.id,
                    tipoMovimiento: 'Salida',
                    cantidad: cantidadADescontarDeEsteLote,
                    precioUnitarioHistorico: parseFloat(lote.precioUnitario),
                    fechaMovimiento: new Date(),
                    detalle: `Consumo automático Planilla Raciones - Menú: ${menuConReceta.nombre} (Planilla #${nuevaPlanilla.id}) para ${cantidadRaciones} personas.`
                }, { transaction: t });
            }
        }

        // Si procesó todos los insumos con éxito, confirmamos definitivamente la transacción
        await t.commit();

        return res.status(201).json({
            mensaje: `Planilla Diaria procesada con éxito. Se descontaron los insumos por sistema según el orden FIFO estricto.`,
            planilla: nuevaPlanilla
        });

    } catch (error) {
        await t.rollback();
        console.error('Error en la planilla diaria:', error);
        return res.status(500).json({ mensaje: 'Error interno al procesar la planilla de raciones.' });
    }
};

// 2. LISTAR EL HISTORIAL DE LAS PLANILLAS DIARIAS
export const getHistorialPlanillas = async (req, res) => {
    try {
        const historial = await PlanillaRacion.findAll({
            include: [{
                model: Menu,
                as: 'menu',
                attributes: ['nombre']
            }],
            order: [['fecha', 'DESC'], ['id', 'DESC']]
        });
        return res.status(200).json(historial);
    } catch (error) {
        console.error('Error al obtener historial de planillas:', error);
        return res.status(500).json({ mensaje: 'Error al consultar el historial de planillas.' });
    }
};