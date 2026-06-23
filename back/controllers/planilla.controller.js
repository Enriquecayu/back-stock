import sequelize from '../config/database.js';
import { PlanillaRacion, Menu, MenuIngrediente, LoteStock, Kardex, Producto, Usuario } from '../models/index.js';
import { Op } from 'sequelize';

// 1. PROCESAR PLANILLA DIARIA DE RACIONES CON DESCUENTO FIFO AUTOMÁTICO
export const registrarPlanillaDiaria = async (req, res) => {
    // 🛡️ Abrimos una transacción global. Si falta stock de un solo insumo, se cancela TODA la planilla
    const t = await sequelize.transaction();

    try {
        const { idMenu, cantidadRaciones, observaciones, turno, tipoDestinatario } = req.body;

        // 🎯 EXTRACCIÓN ULTRA SEGURA: Extraemos el ID del usuario directamente desde el Token JWT
        const idUsuarioLogueado = req.usuario.id;

        // Validaciones iniciales
        if (!idMenu || !cantidadRaciones || parseInt(cantidadRaciones) <= 0 || !turno || !tipoDestinatario) {
            return res.status(400).json({
                mensaje: 'Debe especificar menú, cantidad de raciones válida, turno y tipo de destinatario.'
            });
        }

        // Verificar que el menú exista y traer su receta completa con los datos del producto
        const menuConReceta = await Menu.findByPk(idMenu, {
            include: [{
                model: MenuIngrediente,
                as: 'ingredientes',
                include: [{ model: Producto, as: 'producto', attributes: ['nombre', 'stockMinimo'] }]
            }],
            transaction: t
        });

        if (!menuConReceta) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'El menú seleccionado no existe.' });
        }

        // 1. Guardar la cabecera de la planilla en 'planilla_raciones' firmada por el usuario
        const nuevaPlanilla = await PlanillaRacion.create({
            idMenu,
            idUsuario: idUsuarioLogueado, // 🎯 Guardamos el responsable del registro
            fecha: new Date(),
            turno,
            tipoDestinatario,
            cantidadRaciones,
            observaciones
        }, { transaction: t });

        // 2. Iterar por cada ingrediente de la receta para descontar del stock físico
        for (const ing of menuConReceta.ingredientes) {
            const idProducto = ing.idProducto;
            const cantidadRequeridaPorPersona = parseFloat(ing.cantidadPorPersona);
            const cantidadTotalRequerida = cantidadRequeridaPorPersona * parseInt(cantidadRaciones);

            // Buscar lotes con stock activo ordenados por vencimiento (FIFO)
            const lotesDisponibles = await LoteStock.findAll({
                where: {
                    idProducto,
                    cantidadActual: { [Op.gt]: 0 }
                },
                order: [['fechaVencimiento', 'ASC']],
                transaction: t
            });

            // Calcular stock total sumando lo disponible en todos sus lotes
            const stockTotalDisponible = lotesDisponibles.reduce((suma, l) => suma + parseFloat(l.cantidadActual), 0);

            if (stockTotalDisponible < cantidadTotalRequerida) {
                await t.rollback();
                return res.status(400).json({
                    mensaje: `Stock insuficiente para el insumo: "${ing.producto.nombre}". Requerido: ${cantidadTotalRequerida}, Disponible en sistema: ${stockTotalDisponible}. Operación cancelada.`
                });
            }

            let cantidadRestantePorDescontar = cantidadTotalRequerida;

            for (const lote of lotesDisponibles) {
                if (cantidadRestantePorDescontar <= 0) break;

                const stockLote = parseFloat(lote.cantidadActual);
                let cantidadA_Descontar = 0;

                if (stockLote >= cantidadRestantePorDescontar) {
                    cantidadA_Descontar = cantidadRestantePorDescontar;
                    lote.cantidadActual = stockLote - cantidadA_Descontar;
                    cantidadRestantePorDescontar = 0;
                } else {
                    cantidadA_Descontar = stockLote;
                    lote.cantidadActual = 0;
                    cantidadRestantePorDescontar -= cantidadA_Descontar;
                }

                await lote.save({ transaction: t });

                // Asentar el movimiento en el historial contable del Kardex registrando qué usuario operó
                await Kardex.create({
                    idLote: lote.id,
                    tipoMovimiento: 'Salida',
                    cantidad: cantidadA_Descontar,
                    precioUnitarioHistorico: lote.precioUnitario,
                    fechaMovimiento: new Date(),
                    detalle: `Consumo automático Planilla Raciones - Menú: ${menuConReceta.nombre} (Planilla #${nuevaPlanilla.id}, Turno: ${turno}) por usuario ID: ${idUsuarioLogueado}.`
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

// 2. LISTAR EL HISTORIAL DE LAS PLANILLAS DIARIAS (Con datos del usuario que registró)
export const getHistorialPlanillas = async (req, res) => {
    try {
        const historial = await PlanillaRacion.findAll({
            include: [
                {
                    model: Menu,
                    as: 'menu',
                    attributes: ['nombre']
                },
                {
                    model: Usuario, // 🎯 Incluimos el modelo Usuario para auditar en el frontend
                    as: 'usuario',
                    attributes: ['nombreCompleto', 'rol']
                }
            ],
            order: [['fecha', 'DESC'], ['id', 'DESC']]
        });
        return res.status(200).json(historial);
    } catch (error) {
        console.error('Error al obtener historial de planillas:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el historial de planillas.' });
    }
};