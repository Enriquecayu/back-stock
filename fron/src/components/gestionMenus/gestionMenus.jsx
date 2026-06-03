import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/api'; // 🎯 Tu cliente Axios real y correcto
import './gestionMenus.css';

const GestionMenus = () => {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [productos, setProductos] = useState([]); 
    const [ingredientesReceta, setIngredientesReceta] = useState([]);
    const [idProductoSeleccionado, setIdProductoSeleccionado] = useState('');
    const [cantidadPorPersona, setCantidadPorPersona] = useState('');
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // 1. Cargar el catálogo general usando tu estructura de función asíncrona
    useEffect(() => {
        const obtenerProductos = async () => {
            try {
                // 🎯 Quitamos el /api excedente porque tu baseURL ya lo incluye
                const respuesta = await axiosClient.get('/productos');
                setProductos(respuesta.data);
            } catch (error) {
                console.error('Error al traer catálogo de productos en gestión menús:', error);
            }
        };
        obtenerProductos();
    }, []);

    // 2. Agregar ingrediente a la lista temporal
    const handleAgregarIngrediente = (e) => {
        e.preventDefault();

        if (!idProductoSeleccionado || !cantidadPorPersona || parseFloat(cantidadPorPersona) <= 0) {
            mostrarMensaje('Seleccione un producto y coloque una cantidad válida.', 'error');
            return;
        }

        const prodEncontrado = productos.find(p => p.id === parseInt(idProductoSeleccionado));

        const yaExiste = ingredientesReceta.some(ing => ing.idProducto === prodEncontrado.id);
        if (yaExiste) {
            mostrarMensaje('Este producto ya fue agregado a la receta.', 'error');
            return;
        }

        setIngredientesReceta([...ingredientesReceta, {
            idProducto: prodEncontrado.id,
            nombre: prodEncontrado.nombre,
            unidadMedida: prodEncontrado.unidadMedida,
            cantidadPorPersona: parseFloat(cantidadPorPersona)
        }]);

        setIdProductoSeleccionado('');
        setCantidadPorPersona('');
    };

    // 3. Quitar ingrediente de la lista temporal
    const handleQuitarIngrediente = (id) => {
        setIngredientesReceta(ingredientesReceta.filter(ing => ing.idProducto !== id));
    };

    // 4. Enviar la receta usando tu estructura profesional con async/await
    const handleGuardarMenu = async (e) => {
        e.preventDefault();

        if (!nombre.trim() || ingredientesReceta.length === 0) {
            mostrarMensaje('Complete el nombre del plato y agregue al menos un ingrediente.', 'error');
            return;
        }

        const datosMenu = {
            nombre: nombre,
            descripcion: descripcion,
            ingredientes: ingredientesReceta.map(ing => ({
                idProducto: ing.idProducto,
                cantidadPorPersona: ing.cantidadPorPersona
            }))
        };

        try {
            // 🎯 Enviamos directo a /menus respetando tu cliente Axios
            const respuesta = await axiosClient.post('/menus', datosMenu);

            mostrarMensaje(respuesta.data.mensaje || 'Receta guardada con éxito.', 'exito');
            setNombre('');
            setDescripcion('');
            setIngredientesReceta([]);

        } catch (error) {
            console.error('Error al guardar menú con Axios:', error);
            const mensajeError = error.response?.data?.mensaje || 'Error de conexión con el servidor.';
            mostrarMensaje(mensajeError, 'error');
        }
    };

    const mostrarMensaje = (texto, tipo) => {
        setMensaje({ texto, tipo });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
    };

    return (
        <div className="container">
            <h2 className="titulo">Configurar Nueva Receta / Menú</h2>
            
            {mensaje.texto && (
                <div className={`mensaje ${mensaje.tipo === 'exito' ? 'exito' : 'error'}`}>
                    {mensaje.texto}
                </div>
            )}

            <form onSubmit={handleGuardarMenu}>
                <div className="formGroup">
                    <label>Nombre del Plato:</label>
                    <input 
                        type="text" 
                        className="inputControl"
                        value={nombre} 
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Guiso de Arroz con Carne"
                    />
                </div>

                <div className="formGroup">
                    <label>Descripción / Tipo de Dieta:</label>
                    <input 
                        type="text" 
                        className="inputControl"
                        value={descripcion} 
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Ej: Menú General Común / Dieta Liviana"
                    />
                </div>

                <fieldset className="fieldset">
                    <legend>Añadir Ingredientes (Gramos/Kilos por Persona)</legend>
                    <div className="rowInputs">
                        <div className="colProducto">
                            <label>Producto:</label>
                            <select 
                                className="inputControl"
                                value={idProductoSeleccionado} 
                                onChange={(e) => setIdProductoSeleccionado(e.target.value)}
                            >
                                <option value="">-- Seleccione Insumo --</option>
                                {productos.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre} ({p.unidadMedida})</option>
                                ))}
                            </select>
                        </div>

                        <div className="colCantidad">
                            <label>Cant. por ración:</label>
                            <input 
                                type="number" 
                                step="0.0001"
                                className="inputControl"
                                value={cantidadPorPersona} 
                                onChange={(e) => setCantidadPorPersona(e.target.value)}
                                placeholder="Ej: 0.1200"
                            />
                        </div>

                        <button onClick={handleAgregarIngrediente} className="btnSecundario">
                            + Agregar
                        </button>
                    </div>
                </fieldset>

                <h3>Ingredientes de la Receta:</h3>
                {ingredientesReceta.length === 0 ? (
                    <p className="textoVacio">No se agregaron ingredientes todavía.</p>
                ) : (
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>Insumo</th>
                                <th>Por Persona</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ingredientesReceta.map(ing => (
                                <tr key={ing.idProducto}>
                                    <td>{ing.nombre}</td>
                                    <td>{ing.cantidadPorPersona} {ing.unidadMedida}</td>
                                    <td>
                                        <button 
                                            type="button" 
                                            onClick={() => handleQuitarIngrediente(ing.idProducto)}
                                            className="btnEliminar"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <button type="submit" className="btnPrincipal">
                    💾 Guardar Receta Maestra
                </button>
            </form>
        </div>
    );
};

export default GestionMenus;