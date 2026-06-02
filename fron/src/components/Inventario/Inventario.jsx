import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/api'; // Tu cliente Axios
import './Inventario.css';

const Inventario = () => {
    const [productos, setProductos] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(true);

    // Estados para controlar la Carga Perezosa (Lazy Loading) de lotes
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [lotes, setLotes] = useState([]);
    const [loadingLotes, setLoadingLotes] = useState(false);

    // 1. Cargar el catálogo general al renderizar la pantalla
    useEffect(() => {
        const obtenerProductos = async () => {
            try {
                const respuesta = await axiosClient.get('/productos');
                setProductos(respuesta.data);
            } catch (error) {
                console.error('Error al traer catálogo de productos:', error);
            } finally {
                setLoadingProductos(false);
            }
        };
        obtenerProductos();
    }, []);

    // 2. Evento del Clic: Trae los lotes correspondientes bajo demanda
    const manejarSeleccionProducto = async (producto) => {
        // Si vuelve a cliquear el mismo que ya está abierto, lo cerramos/ocultamos
        if (productoSeleccionado?.id === producto.id) {
            setProductoSeleccionado(null);
            setLotes([]);
            return;
        }

        setProductoSeleccionado(producto);
        setLotes([]);
        setLoadingLotes(true);

        try {
            // Petición con query string directo a tu controlador modificado
            const respuesta = await axiosClient.get(`/lotes?idProducto=${producto.id}`);
            setLotes(respuesta.data);
        } catch (error) {
            console.error('Error al cargar lotes perezosos:', error);
        } finally {
            setLoadingLotes(false);
        }
    };

    if (loadingProductos) {
        return (
            <div className="inventario-container">
                <p className="loading-text">Cargando inventario general de depósitos...</p>
            </div>
        );
    }

    return (
        <div className="inventario-container fade-in">
            <h3 className="inventario-title">📦 Inventario General de Depósito</h3>

            {/* Tabla del catálogo base */}
            <table className="tabla-inventario">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre del Insumo</th>
                        <th>Categoría</th>
                        <th>Unidad de Medida</th>
                        <th>Lotes en Stock</th>
                    </tr>
                </thead>
                <tbody>
                    {productos.map((prod) => (
                        <tr
                            key={prod.id}
                            className={`fila-producto ${productoSeleccionado?.id === prod.id ? 'fila-seleccionada' : ''}`}
                            onClick={() => manejarSeleccionProducto(prod)}
                        >
                            <td>#{prod.id}</td>
                            <td><strong>{prod.nombre}</strong></td>
                            <td>{prod.categoria}</td>
                            <td>{prod.unidadMedida}</td>
                            <td>{prod.totalLotes || 0} lote(s) activo(s)</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <p className="txt-ayuda">💡 Haga clic sobre cualquier fila para desplegar u ocultar el desglose de lotes físicos (FIFO).</p>

            {/* --- BLOQUE DE DESGLOSE (Lazy Loading) --- */}
            {productoSeleccionado && (
                <div className="seccion-lotes-desglose fade-in">
                    <h4 className="lotes-title">
                        📋 Trazabilidad de Lotes para: {productoSeleccionado.nombre}
                    </h4>

                    {loadingLotes ? (
                        <p className="loading-text">Consultando lotes vigentes en la base de datos...</p>
                    ) : lotes.length === 0 ? (
                        <p>No se registran lotes físicos con existencias para este insumo actualmente.</p>
                    ) : (
                        <div className="grid-lotes">
                            {lotes.map((lote) => (
                                <div key={lote.id} className="tarjeta-lote">
                                    <p><strong>Lote Nº:</strong> {lote.numeroLote || 'Sin Código'}</p>
                                    <p><strong>Cant. Inicial:</strong> {lote.cantidadInicial} {productoSeleccionado.unidadMedida}</p>
                                    <p><strong>Cant. Actual:</strong> {lote.cantidadActual} {productoSeleccionado.unidadMedida}</p>
                                    <p><strong>Precio Unit.:</strong> ${lote.precioUnitario}</p>
                                    <p><strong>Vencimiento:</strong> {lote.fechaVencimiento}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Inventario;