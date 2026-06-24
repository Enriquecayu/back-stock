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

    // 1. Cargar el catálogo general al renderizar la pantalla (Incluye stockReal y bajoStock del Back)
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

        // Si selecciona uno nuevo, activamos el estado de carga y consultamos sus lotes
        setProductoSeleccionado(producto);
        setLoadingLotes(true);
        setLotes([]);

        try {
            // Pegamos al endpoint de lotes filtrando por el id del producto
            const respuesta = await axiosClient.get(`/lotes?idProducto=${producto.id}`);
            setLotes(respuesta.data);
        } catch (error) {
            console.error('Error al traer los lotes del producto seleccionado:', error);
        } finally {
            setLoadingLotes(false);
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
                    </tr>
                </thead>
                <tbody>
                    {productos.map((prod) => {
                        const esSeleccionado = productoSeleccionado?.id === prod.id;

                        // 🎯 Determinamos dinámicamente la clase de la fila según su estado
                        let claseFila = "fila-producto";
                        if (esSeleccionado) {
                            claseFila += " fila-seleccionada";
                        } else if (prod.bajoStock) {
                            claseFila += " fila-alerta-critica"; // Se pinta de rojo pastel si está crítico
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

                                {/* 🎯 Mostramos el stock real sumado e inyectamos el cartel de alerta */}
                                <td>
                                    <strong>{prod.stockReal}</strong> {prod.unidadMedida}
                                    {prod.bajoStock && (
                                        <span className="badge-alerta-stock">
                                            ⚠️ Crítico
                                        </span>
                                    )}
                                </td>

                                <td>{prod.stockMinimo} {prod.unidadMedida}</td>
                                <td>{prod.totalLotes || 0} lote(s) activo(s)</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* 3. Panel de Desglose de Lotes (Aparece abajo al hacer clic en una fila) */}
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
                                // 🎯 Evaluamos si el lote específico se quedó sin stock
                                const esAgotado = parseFloat(lote.cantidadActual) <= 0;

                                return (
                                    <div
                                        key={lote.id}
                                        className={`tarjeta-lote ${esAgotado ? 'tarjeta-lote-agotado' : ''}`}
                                    >
                                        <p>
                                            <strong>Lote Nº:</strong> <code>{lote.numeroLote || 'Sin Código'}</code>
                                            {/* 🎯 Badge gris de Agotado */}
                                            {esAgotado && <span className="badge-lote-agotado">Agotado</span>}
                                        </p>
                                        <p><strong>Cant. Inicial:</strong> {lote.cantidadInicial} {productoSeleccionado.unidadMedida}</p>

                                        {/* 🎯 Atenuamos el texto si está vacío */}
                                        <p>
                                            <strong>Cant. Actual:</strong>{' '}
                                            <span style={{
                                                fontWeight: esAgotado ? 'normal' : 'bold',
                                                color: esAgotado ? '#6c757d' : '#000'
                                            }}>
                                                {lote.cantidadActual} {productoSeleccionado.unidadMedida}
                                            </span>
                                        </p>

                                        <p><strong>Precio Unit.:</strong> ${parseFloat(lote.precioUnitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                                        <p><strong>Vencimiento:</strong> {lote.fechaVencimiento ? new Date(lote.fechaVencimiento).toLocaleDateString('es-AR') : 'No vence'}</p>
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