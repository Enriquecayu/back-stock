import sequelize from '../config/database.js';
import { Menu, MenuIngrediente, Producto } from '../models/index.js';

// 1. REGISTRAR UNA RECETA NUEVA (Transaccional)
export const createMenu = async (req, res) => {
    // Abrimos una transacción para proteger la operación
    const t = await sequelize.transaction();

    try {
        const { nombre, descripcion, ingredientes } = req.body;

        // Validaciones básicas de entrada
        if (!nombre || !ingredientes || !Array.isArray(ingredientes) || ingredientes.length === 0) {
            return res.status(400).json({ 
                mensaje: 'Faltan campos obligatorios. Debe incluir el nombre del menú y al menos un ingrediente.' 
            });
        }

        // 1. Guardar el plato base en la tabla 'menus'
        const nuevoMenu = await Menu.create({
            nombre: nombre.trim(),
            descripcion: descripcion ? descripcion.trim() : null
        }, { transaction: t });

        // Arreglo temporal para acumular las filas de los ingredientes
        const filasIngredientes = [];

        // 2. Validar y procesar cada ingrediente enviado en la lista
        for (const ing of ingredientes) {
            const { idProducto, cantidadPorPersona } = ing;

            if (!idProducto || !cantidadPorPersona || parseFloat(cantidadPorPersona) <= 0) {
                await t.rollback();
                return res.status(400).json({ 
                    mensaje: 'Cada ingrediente debe tener un idProducto válido y una cantidad por persona mayor a cero.' 
                });
            }

            // Validar que el producto realmente exista en tu stock general
            const productoExiste = await Producto.findByPk(idProducto, { transaction: t });
            if (!productoExiste) {
                await t.rollback();
                return res.status(404).json({ 
                    mensaje: `El producto con ID ${idProducto} especificado en la receta no existe.` 
                });
            }

            // Armamos la fila vinculando el ID del menú que se acaba de crear arriba
            filasIngredientes.push({
                idMenu: nuevoMenu.id,
                idProducto: idProducto,
                cantidadPorPersona: parseFloat(cantidadPorPersona)
            });
        }

        // 3. Inserción masiva de los ingredientes en 'menu_ingredientes'
        await MenuIngrediente.bulkCreate(filasIngredientes, { transaction: t });

        // Si todo se ejecutó sin fallas, consolidamos los cambios definitivamente
        await t.commit();

        return res.status(201).json({
            mensaje: `El menú "${nuevoMenu.nombre}" y su receta fueron guardados con éxito.`,
            menu: nuevoMenu
        });

    } catch (error) {
        // Si algo falló en el camino, deshacemos todo para no dejar datos huérfanos
        await t.rollback();
        console.error('Error al crear menú con recetas:', error);
        
        // Controlamos que no se intente duplicar un plato (ej: registrar "Guiso de Arroz" dos veces)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ mensaje: 'Ya existe un menú o receta registrado con ese nombre.' });
        }
        
        return res.status(500).json({ mensaje: 'Error interno del servidor al registrar el menú.' });
    }
};

// 2. OBTENER TODAS LAS RECETAS (Para alimentar los selectores de la Planilla)
export const getMenus = async (req, res) => {
    try {
        const menus = await Menu.findAll({
            include: [{
                model: MenuIngrediente,
                as: 'ingredientes',
                attributes: ['idProducto', 'cantidadPorPersona'],
                include: [{
                    model: Producto,
                    as: 'producto',
                    attributes: ['nombre', 'unidadMedida', 'categoria']
                }]
            }],
            order: [['nombre', 'ASC']] // Los ordena alfabéticamente
        });

        return res.status(200).json(menus);
    } catch (error) {
        console.error('Error al obtener recetas:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el catálogo de recetas.' });
    }
};