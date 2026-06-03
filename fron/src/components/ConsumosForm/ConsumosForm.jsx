import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/api';
import './ConsumosForm.css';

const ConsumosForm = () => {
    const [productos, setProductos] = useState([]);
    const [idProducto, setIdProducto] = useState('');
    const [cantidadTotal, setCantidadTotal] = useState('');
    const [detalle, setDetail] = useState('');

    // Estados para respuestas visuales y carga
    const [unidadSeleccionada, setUnidadSeleccionada] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' });

    // 1. Cargar el catálogo de productos disponibles para el select
    useEffect(() => {
        const traerProductos = async () => {
            try {
                const respuesta = await axiosClient.get('/productos');
                setProductos(respuesta.data);
            } catch (error) {
                console.error('Error al mapear productos para consumos:', error);
            }
        };
        traerProductos();
    }, []);

    // 2. Escuchar cambios en el select para clavar la unidad de medida en tiempo real
    const manejarCambioProducto = (e) => {
        const id = e.target.value;
        setIdProducto(id);

        if (id) {
            const prodEncontrado = productos.find(p => p.id === parseInt(id));
            setUnidadSeleccionada(prodEncontrado ? prodEncontrado.unidadMedida : '');
        } else {
            setUnidadSeleccionada('');
        }
    };

    // 3. Enviar el consumo al backend (Algoritmo FIFO transaccional)
    const manejarEnvio = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });

        if (!idProducto || !cantidadTotal || parseFloat(cantidadTotal) <= 0) {
            setStatus({ type: 'error', msg: 'Por favor, ingrese un producto y una cantidad válida mayor a cero.' });
            return;
        }

        setLoading(true);

        try {
            const respuesta = await axiosClient.post('/consumos', {
                idProducto: parseInt(idProducto),
                cantidadTotal: parseFloat(cantidadTotal),
                detalle: detalle
            });

            setStatus({ type: 'success', msg: respuesta.data.mensaje });

            // Limpiamos los campos operativos del formulario tras el éxito
            setIdProducto('');
            setCantidadTotal('');
            setDetail('');
            setUnidadSeleccionada('');
        } catch (error) {
            console.error('Error al registrar salida:', error);
            const mensajeError = error.response?.data?.mensaje || 'Error interno al procesar el consumo.';
            setStatus({ type: 'error', msg: mensajeError });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="consumo-form-container">
            <h3 className="consumo-form-title">🔻 Registrar Consumo / Salida de Stock</h3>

            {status.msg && (
                <div className={`alert-consumo alert-consumo-${status.type}`}>
                    {status.msg}
                </div>
            )}

            <form onSubmit={manejarEnvio}>
                {/* Selector de Insumo */}
                <div className="consumo-form-group">
                    <label htmlFor="select-producto">Seleccione el Insumo a retirar:</label>
                    <select
                        id="select-producto"
                        className="consumo-form-select"
                        value={idProducto}
                        onChange={manejarCambioProducto}
                        disabled={loading}
                    >
                        <option value="">-- Seleccionar Producto --</option>
                        {productos.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.nombre} ({p.categoria})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Cantidad Dinámica */}
                <div className="consumo-form-group">
                    <label htmlFor="input-cantidad">Cantidad a consumir:</label>
                    <div className="input-unidades-box">
                        <input
                            id="input-cantidad"
                            type="number"
                            step="any"
                            className="consumo-form-input"
                            placeholder="Ej: 25.5"
                            value={cantidadTotal}
                            onChange={(e) => setCantidadTotal(e.target.value)}
                            disabled={loading}
                        />
                        {unidadSeleccionada && (
                            <span className="txt-unidad-medida">{unidadSeleccionada}</span>
                        )}
                    </div>
                </div>

                {/* Detalle o Motivo */}
                <div className="consumo-form-group">
                    <label htmlFor="input-detalle">Detalle, destino o motivo del gasto:</label>
                    <input
                        id="input-detalle"
                        type="text"
                        className="consumo-form-input"
                        placeholder="Ej: Almuerzo Pabellón A / Descarte por rotura"
                        value={detalle}
                        onChange={(e) => setDetail(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    className="btn-submit-consumo"
                    disabled={loading}
                >
                    {loading ? 'Procesando Descuento FIFO...' : '🔥 Confirmar Salida de Stock'}
                </button>
            </form>
        </div>
    );
};

export default ConsumosForm;