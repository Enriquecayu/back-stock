import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/api'; // Tu cliente Axios configurado
import './LotesForm.css';

const LotesForm = () => {
    // Lista de productos para el selector desplegable
    const [productos, setProductos] = useState([]);

    // Estados para cada campo del modelo LoteStock
    const [idProducto, setIdProducto] = useState('');
    const [numeroLote, setNumeroLote] = useState('');
    const [cantidadInicial, setCantidadInicial] = useState('');
    const [fechaVencimiento, setFechaVencimiento] = useState('');
    const [precioUnitario, setPrecioUnitario] = useState('');

    // Estados de control de la UI
    const [loading, setLoading] = useState(false);
    const [loadingProductos, setLoadingProductos] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // Cargar los productos disponibles al abrir el formulario
    useEffect(() => {
        const obtenerProductosParaSelector = async () => {
            try {
                const respuesta = await axiosClient.get('/productos');
                setProductos(respuesta.data);
            } catch (error) {
                console.error('Error al cargar productos para el formulario:', error);
                setMensaje({
                    texto: 'No se pudieron cargar los productos. Verifique la conexión con el servidor.',
                    tipo: 'error'
                });
            } finally {
                setLoadingProductos(false);
            }
        };

        obtenerProductosParaSelector();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ texto: '', tipo: '' });

        // Validaciones básicas de campos obligatorios según el backend
        if (!idProducto || !cantidadInicial || !fechaVencimiento || !precioUnitario) {
            setMensaje({ texto: 'Por favor, complete todos los campos obligatorios.', tipo: 'error' });
            return;
        }

        if (Number(cantidadInicial) <= 0 || Number(precioUnitario) < 0) {
            setMensaje({ texto: 'Ingrese valores numéricos válidos superiores a cero.', tipo: 'error' });
            return;
        }

        setLoading(true);

        try {
            // Petición POST exacta a /api/lotes
            const respuesta = await axiosClient.post('/lotes', {
                idProducto: parseInt(idProducto),
                numeroLote: numeroLote.trim() || null, // Si está vacío, se guarda como null
                cantidadInicial: parseFloat(cantidadInicial),
                fechaVencimiento, // Pasa directo en formato YYYY-MM-DD
                precioUnitario: parseFloat(precioUnitario)
            });

            setMensaje({
                texto: respuesta.data.mensaje || 'Lote registrado con éxito en el stock.',
                tipo: 'success'
            });

            // Limpiar formulario conservando la carga perezosa
            setIdProducto('');
            setNumeroLote('');
            setCantidadInicial('');
            setFechaVencimiento('');
            setPrecioUnitario('');

        } catch (error) {
            console.error('Error al registrar el lote:', error);
            const msgError = error.response?.data?.mensaje || 'Error interno al registrar el lote en el stock.';
            setMensaje({ texto: msgError, tipo: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lotes-form-container">
            <h3 className="lotes-form-title">📥 Registrar Ingreso de Lote</h3>

            {mensaje.texto && (
                <div className={`message-alert ${mensaje.tipo}`}>
                    {mensaje.texto}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Selector de Producto */}
                <div className="form-group">
                    <label htmlFor="idProducto">Seleccionar Producto / Insumo *</label>
                    <select
                        id="idProducto"
                        className="form-input"
                        value={idProducto}
                        onChange={(e) => setIdProducto(e.target.value)}
                        disabled={loading || loadingProductos}
                        required
                    >
                        <option value="">{loadingProductos ? 'Cargando catálogo...' : '-- Seleccione un Insumo --'}</option>
                        {productos.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                                {prod.nombre} ({prod.unidadMedida})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Campo: Código o Número de Lote */}
                <div className="form-group">
                    <label htmlFor="numeroLote">Código / Número de Lote (Opcional)</label>
                    <input
                        type="text"
                        id="numeroLote"
                        className="form-input"
                        placeholder="Ej. LOT-2026-A1"
                        value={numeroLote}
                        onChange={(e) => setNumeroLote(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {/* Campo: Cantidad Inicial */}
                <div className="form-group">
                    <label htmlFor="cantidadInicial">Cantidad que Ingresa *</label>
                    <input
                        type="number"
                        id="cantidadInicial"
                        step="any"
                        className="form-input"
                        placeholder="Ej. 50.50"
                        value={cantidadInicial}
                        onChange={(e) => setCantidadInicial(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                {/* Campo: Fecha de Vencimiento */}
                <div className="form-group">
                    <label htmlFor="fechaVencimiento">Fecha de Vencimiento de Fábrica *</label>
                    <input
                        type="date"
                        id="fechaVencimiento"
                        className="form-input"
                        value={fechaVencimiento}
                        onChange={(e) => setFechaVencimiento(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                {/* Campo: Precio Unitario */}
                <div className="form-group">
                    <label htmlFor="precioUnitario">Precio Unitario ($) *</label>
                    <input
                        type="number"
                        id="precioUnitario"
                        step="any"
                        className="form-input"
                        placeholder="Ej. 1200.50 (Coloque 0 si no aplica)"
                        value={precioUnitario}
                        onChange={(e) => setPrecioUnitario(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                {/* Botón de Envió */}
                <button
                    type="submit"
                    className="btn-submit-lote"
                    disabled={loading || loadingProductos}
                >
                    {loading ? 'Registrando Entrada...' : 'Registrar Entrada de Lote'}
                </button>
            </form>
        </div>
    );
};

export default LotesForm;