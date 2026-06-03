import { Op } from 'sequelize';
// 🎯 Importamos Kardex junto a los demás modelos para poder auditar los consumos
import { Producto, LoteStock, Kardex } from '../models/index.js';
import sequelize from '../config/database.js';
import ExcelJS from 'exceljs';

// 1. OBTENER TODOS LOS PRODUCTOS
export const getProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll({
            attributes: [
                'id',
                'nombre',
                'categoria',
                'unidadMedida',
                'stockMinimo',
                [
                    sequelize.fn('COUNT', sequelize.col('lotes.id')),
                    'totalLotes'
                ]
            ],
            include: [{
                model: LoteStock,
                as: 'lotes',
                attributes: []
            }],
            group: ['Producto.id'],
            order: [['nombre', 'ASC']]
        });

        return res.status(200).json(productos);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el catálogo.' });
    }
};

// 2. CREAR UN NUEVO PRODUCTO
export const createProducto = async (req, res) => {
    try {
        const { nombre, categoria, unidadMedida, stockMinimo } = req.body;

        if (!nombre || !categoria || !unidadMedida) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
        }

        const nombreLimpio = nombre.trim();

        const productoExiste = await Producto.findOne({
            where: {
                nombre: {
                    [Op.iLike]: nombreLimpio
                }
            }
        });

        if (productoExiste) {
            return res.status(400).json({
                mensaje: `El producto "${nombreLimpio}" ya está registrado en el catálogo.`
            });
        }

        const nuevoProducto = await Producto.create({
            nombre,
            categoria,
            unidadMedida,
            stockMinimo: stockMinimo || 0.00
        });

        return res.status(201).json({
            mensaje: 'Producto creado con éxito',
            producto: nuevoProducto
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        return res.status(500).json({ mensaje: 'Error al registrar el producto.' });
    }
};

// 3. ACTUALIZAR UN PRODUCTO (PUT)
export const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, categoria, stockMinimo } = req.body;

        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }

        producto.nombre = nombre || producto.nombre;
        producto.categoria = categoria || producto.categoria;
        producto.stockMinimo = stockMinimo !== undefined ? stockMinimo : producto.stockMinimo;

        await producto.save();

        return res.status(200).json({ mensaje: 'Producto actualizado con éxito', producto });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        return res.status(500).json({ mensaje: 'Error al actualizar el producto.' });
    }
};

// 4. ELIMINAR UN PRODUCTO (DELETE)
export const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }

        await producto.destroy();

        return res.status(200).json({ mensaje: 'Producto eliminado con éxito.' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        return res.status(500).json({
            mensaje: 'No se puede eliminar el producto porque está asociado a lotes activos o movimientos de stock.'
        });
    }
};

// 🚀 5. EXPORTAR PLANILLA MENSUAL DE CONSUMO A EXCEL (SOLO LECTURA)
export const descargarReporteMensualExcel = async (req, res) => {
    try {
        const { mes, anio, categoria } = req.query;

        if (!mes || !anio || !categoria) {
            return res.status(400).json({
                mensaje: 'Faltan parámetros obligatorios en la URL (?mes=X&anio=X&categoria=X).'
            });
        }

        const mesInt = parseInt(mes);
        const anioInt = parseInt(anio);

        // Rango de fechas dinámico (asume los días reales del mes y bisiestos)
        const fechaInicio = new Date(anioInt, mesInt - 1, 1, 0, 0, 0);
        const fechaFin = new Date(anioInt, mesInt, 0, 23, 59, 59);
        const totalDiasMes = fechaFin.getDate();

        // Filtrar productos de la categoría solicitada
        const productos = await Producto.findAll({
            where: { categoria: categoria.trim() },
            order: [['nombre', 'ASC']]
        });

        if (productos.length === 0) {
            return res.status(404).json({
                mensaje: `No se encontraron insumos registrados en la categoría "${categoria}".`
            });
        }

        // Buscar salidas en el Kardex asociadas a los productos del filtro
        const salidasKardex = await Kardex.findAll({
            where: {
                tipoMovimiento: 'Salida',
                fechaMovimiento: { [Op.between]: [fechaInicio, fechaFin] }
            },
            include: [{
                model: LoteStock,
                as: 'lote', // ⚠️ Verifica que este alias coincida con la relación Kardex -> LoteStock en tus modelos
                where: { idProducto: { [Op.in]: productos.map(p => p.id) } }
            }],
            raw: true,
            nest: true
        });

        // Armar matriz en memoria: inicializada en ceros
        const matrizConsumo = {};
        productos.forEach(p => {
            matrizConsumo[p.id] = Array(totalDiasMes + 1).fill(0);
        });

        // Poblar la matriz con los consumos reales por día
        salidasKardex.forEach(mov => {
            const idProd = mov.lote.idProducto;
            const fechaMov = new Date(mov.fechaMovimiento);
            const dia = fechaMov.getDate();

            if (matrizConsumo[idProd]) {
                matrizConsumo[idProd][dia] += parseFloat(mov.cantidad);
            }
        });

        // Construcción formal del entorno Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Consumo Mensual');

        // Fila 1: Título estilizado
        worksheet.mergeCells('A1', 'C1');
        const celdaTitulo = worksheet.getCell('A1');
        celdaTitulo.value = `PLANILLA DE CONSUMO MENSUAL - CATEGORÍA: ${categoria.toUpperCase()}`;
        celdaTitulo.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } };
        celdaTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
        celdaTitulo.alignment = { vertical: 'middle', horizontal: 'left' };

        // Fila 2: Subtítulo
        worksheet.getCell('A2').value = `HOSPITAL LUIS ADOLFO GÜEMES | Período: ${mesInt}/${anioInt}`;
        worksheet.getCell('A2').font = { name: 'Arial', size: 10, italic: true, color: { argb: '475569' } };

        // Fila 4: Configurar los encabezados de las columnas
        const cabeceras = ['Detalle del Insumo', 'U. Medida'];
        for (let i = 1; i <= totalDiasMes; i++) {
            cabeceras.push(i.toString());
        }
        cabeceras.push('Total Consumo');

        const filaHeader = worksheet.addRow(cabeceras);
        filaHeader.height = 26;

        filaHeader.eachCell((cell) => {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '1E293B' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'medium' }, right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Anchos de columnas prolijos
        worksheet.getColumn(1).width = 28;
        worksheet.getColumn(2).width = 11;
        for (let i = 3; i <= totalDiasMes + 3; i++) {
            worksheet.getColumn(i).width = 4.8;
        }

        // Cargar los productos reales y consumos mapeados
        productos.forEach(prod => {
            const filaDatos = [prod.nombre, prod.unidadMedida];
            let totalAcumuladoInsumo = 0;

            for (let d = 1; d <= totalDiasMes; d++) {
                const cantDia = matrizConsumo[prod.id][d];
                totalAcumuladoInsumo += cantDia;
                filaDatos.push(cantDia > 0 ? cantDia : ''); // Celda en blanco si da 0
            }
            filaDatos.push(totalAcumuladoInsumo > 0 ? totalAcumuladoInsumo : 0);

            const row = worksheet.addRow(filaDatos);
            row.height = 20;

            row.eachCell((cell, colNumber) => {
                cell.font = { name: 'Arial', size: 9 };
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'thin' }, right: { style: 'thin' }
                };

                if (colNumber === 1) {
                    cell.alignment = { horizontal: 'left', vertical: 'middle' };
                } else {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }

                // Resaltar la última columna de totales acumulados
                if (colNumber === totalDiasMes + 3) {
                    cell.font = { name: 'Arial', size: 9, bold: true };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
                }
            });
        });

        // Configuración de respuesta HTTP Stream Binario
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Planilla_Mensual_${categoria.replace(/ /g, "_")}_M${mes}_A${anio}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error crítico al compilar el Excel:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor al procesar la exportación.' });
    }
};

// 🚀 NUEVO: Obtener todas las categorías únicas que existen en la base de datos
export const getCategoriasUnicas = async (req, res) => {
    try {
        const categorias = await Producto.findAll({
            attributes: [
                // Usamos DISTINCT para que no se dupliquen (si hay 50 productos de "Lácteos", que devuelva "Lácteos" una sola vez)
                [sequelize.fn('DISTINCT', sequelize.col('categoria')), 'categoria']
            ],
            order: [['categoria', 'ASC']],
            raw: true
        });

        // Mapeamos el array para devolver una lista limpia de strings: ["Almacén", "Carnes", ...]
        const listaCategorias = categorias.map(c => c.categoria.trim());

        return res.status(200).json(listaCategorias);
    } catch (error) {
        console.error('Error al obtener categorías únicas:', error);
        return res.status(500).json({ mensaje: 'Error al recuperar las categorías.' });
    }
};