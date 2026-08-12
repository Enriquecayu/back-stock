import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/api';
import './Inventario.css';

const Inventario = () => {
    const [productos, setProductos] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(true);

    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [lotes, setLotes] = useState([]);
    const [loadingLotes, setLoadingLotes] = useState(false);

    // Recuperamos el rol para verificar permisos
    const rolActual = localStorage.getItem('rol');

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

    useEffect(() => {
        obtenerProductos();
    }, []);

    const manejarSeleccionProducto = async (producto) => {
        if (productoSeleccionado?.id === producto.id) {
            setProductoSeleccionado(null);
            setLotes([]);
            return;
        }

        setProductoSeleccionado(producto);
        setLoadingLotes(true);
        setLotes([]);

        try {
            const respuesta = await axiosClient.get(`/lotes?idProducto=${producto.id}`);
            setLotes(respuesta.data);
        } catch (error) {
            console.error('Error al traer los lotes:', error);
        } finally {
            setLoadingLotes(false);
        }
    };

    // 🗑️ Eliminar lote individual
    const handleEliminarLote = async (idLote, e) => {
        e.stopPropagation();
        if (!window.confirm('¿Estás seguro de dar de baja este lote? El Kardex mantendrá su registro histórico.')) return;

        try {
            const respuesta = await axiosClient.delete(`/productos/lotes/${idLote}`);
            alert(respuesta.data.mensaje);

            // Recargamos lotes y productos
            const respLotes = await axiosClient.get(`/lotes?idProducto=${productoSeleccionado.id}`);
            setLotes(respLotes.data);
            obtenerProductos();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.mensaje || 'Error al intentar eliminar el lote.');
        }
    };

    // 🗑️ Eliminar producto completo
    const handleEliminarProducto = async (idProducto, e) => {
        e.stopPropagation();
        if (!window.confirm('¿Estás seguro de eliminar este producto del sistema?')) return;

        try {
            const respuesta = await axiosClient.delete(`/productos/${idProducto}`);
            alert(respuesta.data.mensaje);

            if (productoSeleccionado?.id === idProducto) {
                setProductoSeleccionado(null);
                setLotes([]);
            }
            obtenerProductos();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.mensaje || 'No se puede eliminar el producto porque tiene lotes asociados.');
        }
    };

    if (loadingProductos) {
        return (
            <div className="inventario-container">
                <p className="loading-text">Conectando con el almacén central de Centinela...</p>
            </div>
        );
    }

    return (
        <div className="inventario-container">
            <h2 className="inventario-title">📦 Inventario de Insumos Hospitalarios</h2>

            <table className="tabla-inventario">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Insumo</th>
                        <th>Categoría</th>
                        <th>Stock Total</th>
                        <th>Mínimo Requerido</th>
                        <th>Trazabilidad</th>
                        {rolActual === 'Administrador' && <th>Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {productos.map((prod) => {
                        const esSeleccionado = productoSeleccionado?.id === prod.id;
                        let claseFila = "fila-producto";
                        if (esSeleccionado) {
                            claseFila += " fila-seleccionada";
                        } else if (prod.bajoStock) {
                            claseFila += " fila-alerta-critica";
                        }

                        return (
                            <tr
                                key={prod.id}
                                className={claseFila}
                                onClick={() => manejarSeleccionProducto(prod)}
                            >
                                <td>#{prod.id}</td>
                                <td><strong>{prod.nombre}</strong></td>
                                <td>{prod.categoria}</td>
                                <td>
                                    <strong>{prod.stockReal}</strong> {prod.unidadMedida}
                                    {prod.bajoStock && (
                                        <span className="badge-alerta-stock">⚠️ Crítico</span>
                                    )}
                                </td>
                                <td>{prod.stockMinimo} {prod.unidadMedida}</td>
                                <td>{prod.totalLotes || 0} lote(s) activo(s)</td>

                                {rolActual === 'Administrador' && (
                                    <td>
                                        <button
                                            className="btn-eliminar-tabla"
                                            onClick={(e) => handleEliminarProducto(prod.id, e)}
                                            title="Eliminar producto"
                                            style={{ cursor: 'pointer', background: 'transparent', border: 'none', fontSize: '1.1rem' }}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

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
                            {lotes.map((lote) => {
                                const esAgotado = parseFloat(lote.cantidadActual) <= 0;

                                return (
                                    <div
                                        key={lote.id}
                                        className={`tarjeta-lote ${esAgotado ? 'tarjeta-lote-agotado' : ''}`}
                                    >
                                        <p>
                                            <strong>Lote Nº:</strong> <code>{lote.numeroLote || 'Sin Código'}</code>
                                            {esAgotado && <span className="badge-lote-agotado">Agotado</span>}
                                        </p>
                                        <p><strong>Cant. Inicial:</strong> {lote.cantidadInicial} {productoSeleccionado.unidadMedida}</p>
                                        <p>
                                            <strong>Cant. Actual:</strong>{' '}
                                            <span style={{ fontWeight: esAgotado ? 'normal' : 'bold', color: esAgotado ? '#6c757d' : '#000' }}>
                                                {lote.cantidadActual} {productoSeleccionado.unidadMedida}
                                            </span>
                                        </p>
                                        <p><strong>Precio Unit.:</strong> ${parseFloat(lote.precioUnitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                                        <p><strong>Vencimiento:</strong> {lote.fechaVencimiento ? new Date(lote.fechaVencimiento).toLocaleDateString('es-AR') : 'No vence'}</p>

                                        {rolActual === 'Administrador' && (
                                            <button
                                                className="btn-eliminar-lote"
                                                onClick={(e) => handleEliminarLote(lote.id, e)}
                                                style={{ marginTop: '10px', width: '100%', padding: '6px', background: '#ffe3e3', border: '1px solid #fa5252', color: '#c92a2a', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                🗑️ Dar de baja lote
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Inventario;