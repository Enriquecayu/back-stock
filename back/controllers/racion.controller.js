import { RegistroRacion } from '../models/index.js';
import { Op } from 'sequelize';

// 1. OBTENER TODAS LAS RACIONES (Ordenadas por lo más reciente)
export const getRaciones = async (req, res) => {
    try {
        const raciones = await RegistroRacion.findAll({
            order: [['fecha', 'DESC']]
        });
        return res.status(200).json(raciones);
    } catch (error) {
        console.error('Error al obtener raciones:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el historial de raciones.' });
    }
};

// 2. REGISTRAR UN NUEVO CONTEO DE RACIONES (Con búnker anti-duplicación)
export const createRacion = async (req, res) => {
    try {
        const { fecha, turno, tipoDestinatario, cantidad, observaciones } = req.body;

        // 🛡️ Validación 1: Campos obligatorios
        if (!fecha || !turno || !tipoDestinatario || cantidad === undefined) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios (fecha, turno, tipoDestinatario o cantidad).' });
        }

        // 🛡️ Validación 2: Cantidad lógica
        if (Number(cantidad) <= 0) {
            return res.status(400).json({ mensaje: 'La cantidad de raciones debe ser un número mayor a cero.' });
        }

        // 🛡️ Validación 3: El búnker anti-duplicados por combinación única
        const existeRegistro = await RegistroRacion.findOne({
            where: {
                fecha,
                turno,
                tipoDestinatario
            }
        });

        if (existeRegistro) {
            return res.status(400).json({
                mensaje: `Ya existe un registro de raciones para el turno '${turno}' del día ${fecha} destinado a '${tipoDestinatario}'. Intente editar el registro existente.`
            });
        }

        // Si pasó los escudos, se crea con éxito
        const nuevaRacion = await RegistroRacion.create({
            fecha,
            turno,          // 'D', 'A', 'M' o 'C'
            tipoDestinatario, // 'Normal', 'Dieta', 'Acompañante' o 'Personal'
            cantidad,
            observaciones: observaciones?.trim() || null // Limpiamos espacios
        });

        return res.status(201).json({
            mensaje: 'Registro de ración guardado con éxito',
            racion: nuevaRacion
        });
    } catch (error) {
        console.error('Error al crear ración:', error);
        return res.status(500).json({ mensaje: 'Error al guardar el registro de ración.' });
    }
};

// 3. MODIFICAR UN REGISTRO (Protegiendo de no chocar con duplicados)
export const updateRacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, turno, tipoDestinatario, cantidad, observaciones } = req.body;

        const racion = await RegistroRacion.findByPk(id);

        if (!racion) {
            return res.status(404).json({ mensaje: 'Registro de ración no encontrado.' });
        }

        // 🛡️ Validación: Si van a cambiar la cantidad, que sea válida
        if (cantidad !== undefined && Number(cantidad) <= 0) {
            return res.status(400).json({ mensaje: 'La cantidad de raciones debe ser mayor a cero.' });
        }

        // 🛡️ Validación: Si modifican campos clave, verificar que no choquen con otra fila
        const nuevaFecha = fecha || racion.fecha;
        const nuevoTurno = turno || racion.turno;
        const nuevoDestinatario = tipoDestinatario || racion.tipoDestinatario;

        if (fecha || turno || tipoDestinatario) {
            const choqueDuplicado = await RegistroRacion.findOne({
                where: {
                    fecha: nuevaFecha,
                    turno: nuevoTurno,
                    tipoDestinatario: nuevoDestinatario
                }
            });

            // Si encuentra un registro, pero NO es el mismo que estamos editando, rebotamos
            if (choqueDuplicado && choqueDuplicado.id !== Number(id)) {
                return res.status(400).json({
                    mensaje: 'No se puede actualizar. Ya existe otra planilla registrada para esa misma fecha, turno y destinatario.'
                });
            }
        }

        // Aplicamos los cambios permitidos
        racion.fecha = nuevaFecha;
        racion.turno = nuevoTurno;
        racion.tipoDestinatario = nuevoDestinatario;
        racion.cantidad = cantidad !== undefined ? cantidad : racion.cantidad;
        racion.observaciones = observaciones !== undefined ? observaciones : racion.observaciones;

        await racion.save();

        return res.status(200).json({ mensaje: 'Registro modificado con éxito', racion });
    } catch (error) {
        console.error('Error al actualizar ración:', error);
        return res.status(500).json({ mensaje: 'Error al modificar la ración.' });
    }
};

// 4. ELIMINAR UN REGISTRO (Borrado lógico con justificación obligatoria)
export const deleteRacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body; // Exigimos el motivo en el cuerpo de la petición

        // 🛡️ Validación: Evitamos anulaciones vacías o demasiado cortas
        if (!motivo || motivo.trim().length < 10) {
            return res.status(400).json({
                mensaje: 'Para eliminar/anular un registro es obligatorio ingresar una justificación detallada (mínimo 10 caracteres).'
            });
        }

        const racion = await RegistroRacion.findByPk(id);

        if (!racion) {
            return res.status(404).json({ mensaje: 'Registro no encontrado.' });
        }

        // Antes de aplicar el destroy, dejamos asentado el motivo en las observaciones
        const notasAnteriores = racion.observaciones ? ` | Notas previas: ${racion.observaciones}` : '';
        racion.observaciones = `[ELIMINADO - Motivo: ${motivo.trim()}]${notasAnteriores}`;

        // Guardamos primero el motivo textualmente en la base de datos
        await racion.save();

        // Ahora aplicamos el destroy. Como el modelo tiene 'paranoid: true', 
        // Sequelize NO lo borra de la tabla; solo llena la columna 'deletedAt'
        await racion.destroy();

        return res.status(200).json({
            mensaje: 'Registro de ración eliminado (borrado lógico) correctamente.',
            racion
        });
    } catch (error) {
        console.error('Error al eliminar ración:', error);
        return res.status(500).json({ mensaje: 'Error al eliminar el registro.' });
    }
};

// 5. OBTENER RACIONES BORRADAS LÓGICAMENTE (Papelera de Reciclaje / Auditoría)
export const getRacionesBorradas = async (req, res) => {
    try {
        // Usamos 'paranoid: false' para que Sequelize incluya los registros que tienen 'deletedAt'
        const racionesBorradas = await RegistroRacion.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null // Que el campo deletedAt NO sea nulo (es decir, que estén borrados)
                }
            },
            paranoid: false, // Rompe el bloqueo del borrado lógico para poder leerlos
            order: [['deletedAt', 'DESC']] // Muestra arriba lo último que se borró
        });

        return res.status(200).json(racionesBorradas);
    } catch (error) {
        console.error('Error al obtener raciones borradas:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el historial de eliminaciones.' });
    }
};

// 6. RESTAURAR UNA RACIÓN BORRADA LÓGICAMENTE
export const restoreRacion = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscamos el registro incluyendo los borrados lógicos
        const racion = await RegistroRacion.findByPk(id, { paranoid: false });

        if (!racion) {
            return res.status(404).json({ mensaje: 'El registro no existe en el sistema.' });
        }

        if (racion.deletedAt === null) {
            return res.status(400).json({ mensaje: 'Este registro ya se encuentra activo.' });
        }

        // 🛡️ Validación de oro: Antes de restaurar, verificar que no choque con una ración activa actual
        // (Por si mientras estaba borrada, alguien creó otra para la misma fecha, turno y destinatario)
        const choqueDuplicado = await RegistroRacion.findOne({
            where: {
                fecha: racion.fecha,
                turno: racion.turno,
                tipoDestinatario: racion.tipoDestinatario
            }
        });

        if (choqueDuplicado) {
            return res.status(400).json({
                mensaje: 'No se puede restaurar. Ya existe una planilla activa para la misma fecha, turno y destinatario.'
            });
        }

        // Restauramos el registro (vuelve a poner deletedAt en null)
        await racion.restore();

        return res.status(200).json({
            mensaje: 'Registro de ración restaurado con éxito.',
            racion
        });
    } catch (error) {
        console.error('Error al restaurar ración:', error);
        return res.status(500).json({ mensaje: 'Error al procesar la restauración.' });
    }
};