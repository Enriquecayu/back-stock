import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/api'; // Tu cliente Axios configurado
import './ProductosForm.css';

const ProductosForm = () => {
    // Estados originales para cada campo del modelo Producto
    const [nombre, setNombre] = useState('');
    const [categoria, setCategoria] = useState('');
    const [unidadMedida, setUnidadMedida] = useState('Kg'); // Valor por defecto
    const [stockMinimo, setStockMinimo] = useState('');

    // 🎯 NUEVOS ESTADOS: Para controlar la lista de categorías existentes
    const [categoriasExistentes, setCategoriasExistentes] = useState([]);
    const [crearNuevaCat, setCrearNuevaCat] = useState(false); // Alterna entre Lista y Teclado
    const [loadingCategorias, setLoadingCategorias] = useState(true);

    // Estados para la respuesta del servidor y feedback visual
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); // tipo: 'success' o 'error'

    // 🚀 Función para traer las categorías guardadas en la base de datos
    const obtenerCategorias = async () => {
        try {
            setLoadingCategorias(true);
            const respuesta = await axiosClient.get('/productos/categorias-existentes');
            setCategoriasExistentes(respuesta.data);
        } catch (error) {
            console.error('Error al traer las categorías de la BD:', error);
        } finally {
            setLoadingCategorias(false);
        }
    };

    // Al cargar el formulario por primera vez, traemos la lista
    useEffect(() => {
        obtenerCategorias();
    }, []);

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
                categoria: categoria.trim(), // Envía la que seleccionó del select o la que tipeó
                unidadMedida,
                stockMinimo: stockMinimo ? parseFloat(stockMinimo) : 0.00
            });

            // Si el backend responde exitosamente (201)
            setMensaje({
                texto: respuesta.data.mensaje || 'Producto registrado exitosamente en el catálogo.',
                tipo: 'success'
            });

            // Guardamos un segundo la categoría usada para que no se le borre a la encargada
            const categoriaUtilizada = categoria.trim();

            // Limpiar el formulario para permitir una nueva carga
            setNombre('');
            setUnidadMedida('Kg');
            setStockMinimo('');
            
            // 🚀 REFRESCAR LA LISTA: Le pedimos a la BD las categorías de nuevo.
            // Si creó una nueva, ahora va a estar incluida en el array.
            await obtenerCategorias();

            // Volvemos al modo selector por defecto y le dejamos marcada la categoría que usó
            setCrearNuevaCat(false);
            setCategoria(categoriaUtilizada);

        } catch (error) {
            console.error('Error al registrar producto:', error);
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

                {/* 🎯 Campo: Categoría REESTRUCTURADO */}
                <div className="form-group">
                    {/* Contenedor flexible para poner la etiqueta a la izquierda y el botón a la derecha */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label htmlFor="categoria">Categoría *</label>
                        
                        {/* Botón interactivo para cambiar de modo */}
                        <button
                            type="button"
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#1e3a8a', 
                                fontSize: '12px', 
                                fontWeight: 'bold', 
                                cursor: 'pointer', 
                                textDecoration: 'underline', 
                                padding: 0 
                            }}
                            onClick={() => {
                                setCrearNuevaCat(!crearNuevaCat);
                                setCategoria(''); // Resetea el valor al cambiar de opinión
                            }}
                        >
                            {crearNuevaCat ? "📋 Elegir de la lista" : "➕ Crear nueva categoría"}
                        </button>
                    </div>

                    {crearNuevaCat ? (
                        /* MODO A: Si quiere crear una nueva, se muestra tu input clásico de texto */
                        <input
                            type="text"
                            id="categoria"
                            className="form-input"
                            placeholder="Escriba el nuevo rubro (Ej. Panadería, Pollería)"
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            disabled={loading}
                            required
                        />
                    ) : (
                        /* MODO B: Por defecto muestra un desplegable con tus mismos estilos de CSS */
                        <select
                            id="categoria"
                            className="form-input"
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            disabled={loading || loadingCategorias}
                            required
                        >
                            {loadingCategorias ? (
                                <option value="">Cargando rubros de la base de datos...</option>
                            ) : (
                                <>
                                    <option value="">-- Seleccione un Rubro --</option>
                                    {categoriasExistentes.map((cat, idx) => (
                                        <option key={idx} value={cat}>{cat}</option>
                                    ))}
                                </>
                            )}
                        </select>
                    )}
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

                {/* Botón de Envío */}
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