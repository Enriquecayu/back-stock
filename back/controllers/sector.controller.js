import { SectorDestinatario } from '../models/index.js';

// 🛡️ 1. REGISTRAR UN NUEVO SECTOR (Solo accesible por la Administradora)
export const createSector = async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ mensaje: 'El nombre del sector es obligatorio.' });
        }

        // Creamos el sector normalizando el texto (quitando espacios extras)
        const nuevoSector = await SectorDestinatario.create({
            nombre: nombre.trim()
        });

        return res.status(201).json({
            mensaje: 'Sector autorizado registrado con éxito.',
            sector: nuevoSector
        });
    } catch (error) {
        console.error('Error al crear sector:', error);

        // Si intenta duplicar un sector existente saltará el búnker de la base de datos
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ mensaje: 'Ese sector ya se encuentra registrado en el sistema.' });
        }

        return res.status(500).json({ mensaje: 'Error interno al registrar el sector.' });
    }
};

// 📋 2. OBTENER TODOS LOS SECTORES (Para alimentar el select de la Cocinera)
export const getSectores = async (req, res) => {
    try {
        const sectores = await SectorDestinatario.findAll({
            order: [['nombre', 'ASC']] // Los ordena alfabéticamente
        });
        return res.status(200).json(sectores);
    } catch (error) {
        console.error('Error al obtener sectores:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el listado de sectores.' });
    }
};