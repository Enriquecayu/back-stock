import { LoteStock, Producto } from '../models/index.js';

// 1. OBTENER TODOS LOS LOTES (Con los datos del Producto)
export const getLotes = async (req, res) => {
    try {
        const lotes = await LoteStock.findAll({
            include: [{
                model: Producto,
                as: 'producto',
                attributes: ['nombre', 'categoria', 'unidadMedida']
            }],
            order: [['fechaVencimiento', 'ASC']] // FIFO: Muestra primero los que vencen antes
        });
        return res.status(200).json(lotes);
    } catch (error) {
        console.error('Error al obtener lotes:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el listado de lotes.' });
    }
};

// 2. REGISTRAR UN NUEVO LOTE (Ingreso de mercadería)
export const createLote = async (req, res) => {
    try {
        const { idProducto, numeroLote, cantidadInicial, fechaVencimiento, precioUnitario } = req.body;

        // Validamos campos obligatorios
        if (!idProducto || !cantidadInicial || !fechaVencimiento || !precioUnitario) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios para el lote.' });
        }

        // Verificamos si el producto ("el estante") existe
        const productoExiste = await Producto.findByPk(idProducto);
        if (!productoExiste) {
            return res.status(404).json({ mensaje: 'El producto especificado no existe.' });
        }

        // Creamos el lote. Al ingresar, cantidadActual es igual a la cantidadInicial
        const nuevoLote = await LoteStock.create({
            idProducto,
            numeroLote,
            cantidadInicial,
            cantidadActual: cantidadInicial,
            fechaVencimiento,
            precioUnitario
        });

        return res.status(201).json({
            mensaje: 'Lote registrado con éxito en el stock',
            lote: nuevoLote
        });
    } catch (error) {
        console.error('Error al crear lote:', error);
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