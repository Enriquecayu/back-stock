import React, { useState } from 'react';
import axiosClient from '../../services/api'; // Tu cliente Axios configurado
import './ProductosForm.css';

const ProductosForm = () => {
    // Estados para cada campo del modelo Producto
    const [nombre, setNombre] = useState('');
    const [categoria, setCategoria] = useState('');
    const [unidadMedida, setUnidadMedida] = useState('Kg'); // Valor por defecto
    const [stockMinimo, setStockMinimo] = useState('');

    // Estados para la respuesta del servidor y feedback visual
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); // tipo: 'success' o 'error'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ texto: '', tipo: '' });

        // Validación local básica
        if (!nombre.trim() || !categoria.trim() || !unidadMedida) {
            setMensaje({ texto: 'Por favor, complete todos los campos obligatorios.', tipo: 'error' });
            return;
        }

        setLoading(true);

        try {
            // Petición POST directa a tu ruta base configurada en Express (/api/productos)
            const respuesta = await axiosClient.post('/productos', {
                nombre: nombre.trim(),
                categoria: categoria.trim(),
                unidadMedida,
                stockMinimo: stockMinimo ? parseFloat(stockMinimo) : 0.00
            });

            // Si el backend responde exitosamente (201)
            setMensaje({
                texto: respuesta.data.mensaje || 'Producto registrado exitosamente en el catálogo.',
                tipo: 'success'
            });

            // Limpiar el formulario para permitir una nueva carga
            setNombre('');
            setCategoria('');
            setUnidadMedida('Kg');
            setStockMinimo('');

        } catch (error) {
            console.error('Error al registrar producto:', error);
            // Captura el mensaje de error de validación del backend (ej: si ya existe el producto)
            const msgError = error.response?.data?.mensaje || 'Error interno al registrar el producto.';
            setMensaje({ texto: msgError, tipo: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="product-form-container">
            <h3 className="product-form-title">📝 Registrar Nuevo Insumo</h3>

            {/* Alertas de Feedback */}
            {mensaje.texto && (
                <div className={`message-alert ${mensaje.tipo}`}>
                    {mensaje.texto}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Campo: Nombre */}
                <div className="form-group">
                    <label htmlFor="nombre">Nombre del Producto *</label>
                    <input
                        type="text"
                        id="nombre"
                        className="form-input"
                        placeholder="Ej. Arroz Integral, Fideos Tallarín, Pollo"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                {/* Campo: Categoría */}
                <div className="form-group">
                    <label htmlFor="categoria">Categoría *</label>
                    <input
                        type="text"
                        id="categoria"
                        className="form-input"
                        placeholder="Ej. Almacén, Carnes, Lácteos, Verdulería"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="unidadMedida">Unidad de Medida *</label>
                    <input
                        type="text"
                        id="unidadMedida"
                        className="form-input"
                        placeholder="Ej. Kg, Litros, Horma, Maple, Cajón, Bolsa"
                        value={unidadMedida}
                        onChange={(e) => setUnidadMedida(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                {/* Campo: Stock Mínimo */}
                <div className="form-group">
                    <label htmlFor="stockMinimo">Stock Mínimo de Alerta (Opcional)</label>
                    <input
                        type="number"
                        id="stockMinimo"
                        step="any"
                        className="form-input"
                        placeholder="Ej. 10.00 (Deja vacío para 0.00)"
                        value={stockMinimo}
                        onChange={(e) => setStockMinimo(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {/* Botón de Envió */}
                <button
                    type="submit"
                    className="btn-submit-product"
                    disabled={loading}
                >
                    {loading ? 'Guardando en Catálogo...' : 'Guardar Producto'}
                </button>
            </form>
        </div>
    );
};

export default ProductosForm;