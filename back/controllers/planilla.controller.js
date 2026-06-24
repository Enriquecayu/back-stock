import sequelize from '../config/database.js';
// 🎯 Sumamos SectorDestinatario a los modelos importados
import { PlanillaRacion, Menu, MenuIngrediente, LoteStock, Kardex, Producto, Usuario, SectorDestinatario } from '../models/index.js';
import { Op } from 'sequelize';

// 1. PROCESAR PLANILLA DIARIA DE RACIONES CON DESCUENTO FIFO AUTOMÁTICO
export const registrarPlanillaDiaria = async (req, res) => {
    // 🛡️ Abrimos una transacción global. Si falta stock de un solo insumo, se cancela TODA la planilla
    const t = await sequelize.transaction();

    try {
        // 🔄 Cambiamos tipoDestinatario por idSector en la extracción del body
        const { idMenu, cantidadRaciones, observaciones, turno, idSector } = req.body;

        // 🎯 EXTRACCIÓN ULTRA SEGURA: Extraemos el ID del usuario directamente desde el Token JWT
        const idUsuarioLogueado = req.usuario.id;

        // Validaciones iniciales (Ahora chequea que idSector sea válido)
        if (!idMenu || !cantidadRaciones || parseInt(cantidadRaciones) <= 0 || !turno || !idSector) {
            await t.rollback(); // Aseguramos cerrar la transacción abierta en la validación inicial
            return res.status(400).json({
                mensaje: 'Debe especificar menú, cantidad de raciones válida, turno y sector de destino.'
            });
        }

        // 🛡️ BÚNKER ANTI-DUPLICADOS STRICTO POR ID DE SECTOR (Pedido por el Profesor)
        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);

        const finHoy = new Date();
        finHoy.setHours(23, 59, 59, 999);

        // Buscamos si ya existe una planilla registrada HOY para el MISMO turno y MISMO ID de sector
        const planillaExistente = await PlanillaRacion.findOne({
            where: {
                turno,
                idSector, // 👈 Validación numérica exacta y blindada contra el catálogo
                fecha: {
                    [Op.gte]: inicioHoy,
                    [Op.lte]: finHoy
                }
            },
            transaction: t
        });

        if (planillaExistente) {
            await t.rollback();
            return res.status(400).json({
                mensaje: `Operación cancelada: Ya se registró la planilla de raciones para este turno destinado a este sector el día de hoy.`
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

        // 1. Guardar la cabecera de la planilla en 'planilla_raciones' firmada por el usuario y el ID de sector
        const nuevaPlanilla = await PlanillaRacion.create({
            idMenu,
            idUsuario: idUsuarioLogueado,
            fecha: new Date(),
            turno,
            idSector, // 👈 Guardamos de manera relacional el ID del sector seleccionado
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

// 2. LISTAR EL HISTORIAL DE LAS PLANILLAS DIARIAS (Con datos del usuario y del SECTOR relacional)
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
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombreCompleto', 'rol']
                },
                {
                    // 🎯 Sumamos el sector en el include para mostrar el nombre real en las tablas del Frontend
                    model: SectorDestinatario,
                    as: 'sector',
                    attributes: ['nombre']
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