import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/api';
import './ConsumosForm.css';

const ConsumosForm = () => {
    const [productos, setProductos] = useState([]);
    const [idProducto, setIdProducto] = useState('');
    const [cantidadTotal, setCantidadTotal] = useState('');
    const [detalle, setDetalle] = useState(''); // 🎯 Unificado a setDetalle

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
                setStatus({ type: 'error', msg: 'No se pudo cargar el stock desde el servidor.' });
            }
        };
        traerProductos();
    }, []);

    // 2. Escuchar cambios en el select para fijar la unidad de medida en tiempo real
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

    // 3. Procesar el formulario y ejecutar el descuento FIFO en el Back
    const manejarSubmitConsumo = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });

        // Validaciones básicas de seguridad en el Front
        if (!idProducto) {
            setStatus({ type: 'error', msg: 'Debe seleccionar un insumo del depósito.' });
            return;
        }
        if (!cantidadTotal || parseFloat(cantidadTotal) <= 0) {
            setStatus({ type: 'error', msg: 'Ingrese una cantidad válida mayor a cero.' });
            return;
        }

        setLoading(true);

        try {
            // 🎯 Payload exacto que espera tu controlador ('cantidadTotal')
            const payload = {
                idProducto: parseInt(idProducto),
                cantidadTotal: parseFloat(cantidadTotal),
                detalle: detalle.trim() || 'Salida directa registrada por personal autorizado.'
            };

            // Aseguramos el token de sesión en la cabecera del POST
            const token = localStorage.getItem('token');
            const configuracion = token
                ? { headers: { Authorization: `Bearer ${token}` } }
                : {};

            const respuesta = await axiosClient.post('/consumos', payload, configuracion);

            // Respuesta exitosa
            setStatus({
                type: 'exito',
                msg: respuesta.data.mensaje || '¡Descuento FIFO aplicado correctamente en los lotes!'
            });

            // Reseteamos el formulario por completo
            setIdProducto('');
            setCantidadTotal('');
            setDetalle('');
            setUnidadSeleccionada('');

            // Volvemos a consultar el catálogo para actualizar los flags y stock en caliente
            const actualizarCatalogo = await axiosClient.get('/productos');
            setProductos(actualizarCatalogo.data);

        } catch (error) {
            console.error('Error al procesar el consumo:', error);
            const smsError = error.response?.data?.mensaje || error.response?.data?.error || 'Error interno al procesar la salida de stock.';
            setStatus({ type: 'error', msg: smsError });
        } finally {
            setLoading(false);
        }
    };

    const productoSeleccionadoCritico = idProducto
        ? productos.find(p => p.id === parseInt(idProducto))?.bajoStock
        : false;

    return (
        <div className="consumo-form-container">
            <h2 className="consumo-form-title">🔥 Registro de Consumo Operativo (Salida FIFO)</h2>

            {/* Alertas de Estado (Éxito o Error) */}
            {status.msg && (
                <div className={`mensaje ${status.type === 'exito' ? 'exito' : 'error'}`}>
                    {status.msg}
                </div>
            )}

            <form onSubmit={manejarSubmitConsumo} className="consumo-form">

                {/* Selector de Insumos */}
                <div className="consumo-form-group">
                    <label htmlFor="select-producto">Insumo a retirar del depósito:</label>
                    <select
                        id="select-producto"
                        className="consumo-form-select"
                        value={idProducto}
                        onChange={manejarCambioProducto}
                        disabled={loading}
                        required
                    >
                        <option value="">-- Seleccionar Producto --</option>
                        {productos.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.nombre} ({p.categoria}) {p.bajoStock ? '⚠️ (Crítico)' : ''}
                            </option>
                        ))}
                    </select>

                    {/* Cartel preventivo */}
                    {productoSeleccionadoCritico && (
                        <span style={{
                            color: '#e02424',
                            fontSize: '0.85rem',
                            marginTop: '8px',
                            fontWeight: 'bold',
                            display: 'block',
                            backgroundColor: '#fdf2f2',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #fde8e8'
                        }}>
                            ⚠️ Atención: Este insumo ya se encuentra por debajo de su stock mínimo configurado.
                        </span>
                    )}
                </div>

                {/* Cantidad a retirar */}
                <div className="consumo-form-group">
                    <label htmlFor="input-cantidad">Cantidad a descontar:</label>
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
                            required
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
                        onChange={(e) => setDetalle(e.target.value)} // 🎯 Corregido a setDetalle
                        disabled={loading}
                    />
                </div>

                {/* Botón de Confirmación */}
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