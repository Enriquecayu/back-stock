import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/api'; // Tu cliente Axios real
import './planillaDiaria.css';

const PlanillaDiaria = () => {
    const [menus, setMenus] = useState([]);
    const [idMenuSeleccionado, setIdMenuSeleccionado] = useState('');
    const [cantidadRaciones, setCantidadRaciones] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // 1. Obtener los menús maestros guardados en la base de datos
    useEffect(() => {
        const obtenerMenus = async () => {
            try {
                // Al usar tu cliente, la URL base ya tiene /api, así que llamamos directo a /menus
                const respuesta = await axiosClient.get('/menus');
                setMenus(respuesta.data);
            } catch (error) {
                console.error('Error al traer catálogo de menús con Axios:', error);
            }
        };
        obtenerMenus();
    }, []);

    // 2. Enviar los datos para calcular y descontar stock automáticamente (FIFO)
    const handleProcesarPlanilla = async (e) => {
        e.preventDefault();

        if (!idMenuSeleccionado || !cantidadRaciones || parseInt(cantidadRaciones) <= 0) {
            mostrarMensaje('Seleccione un menú válido y coloque la cantidad de raciones.', 'error');
            return;
        }

        const datosPlanilla = {
            idMenu: parseInt(idMenuSeleccionado),
            cantidadRaciones: parseInt(cantidadRaciones),
            observaciones: observaciones
        };

        setProcesando(true);

        try {
            // Dispara la transacción en tu endpoint POST /planillas
            const respuesta = await axiosClient.post('/planillas', datosPlanilla);

            mostrarMensaje(respuesta.data.mensaje || 'Planilla procesada con éxito. Stock descontado mediante FIFO.', 'exito');

            // Limpiamos los campos del formulario tras el éxito
            setIdMenuSeleccionado('');
            setCantidadRaciones('');
            setObservaciones('');

        } catch (error) {
            console.error('Error al procesar la planilla diaria:', error);

            // Clave: Captura si el backend rebotó la transacción por falta de stock crítico
            const mensajeError = error.response?.data?.mensaje || 'Error de conexión al procesar la planilla.';
            mostrarMensaje(mensajeError, 'error');
        } finally {
            setProcesando(false);
        }
    };

    const mostrarMensaje = (texto, tipo) => {
        setMensaje({ texto, tipo });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
    };

    return (
        <div className="container">
            <h2 className="titulo">Registrar Planilla Diaria de Cocina</h2>

            {mensaje.texto && (
                <div className={`mensaje ${mensaje.tipo === 'exito' ? 'exito' : 'error'}`}>
                    {mensaje.texto}
                </div>
            )}

            <form onSubmit={handleProcesarPlanilla}>
                {/* Selector de Menú Preconfigurado */}
                <div className="formGroup">
                    <label>Menú / Plato del Día:</label>
                    <select
                        className="inputControl"
                        value={idMenuSeleccionado}
                        onChange={(e) => setIdMenuSeleccionado(e.target.value)}
                        disabled={procesando}
                    >
                        <option value="">-- Seleccione el Menú a Cocinar --</option>
                        {menus.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.nombre} {m.descripcion ? `(${m.descripcion})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Cantidad de Internos / Comensales */}
                <div className="formGroup">
                    <label>Cantidad de Raciones (Número de Internos):</label>
                    <input
                        type="number"
                        className="inputControl"
                        value={cantidadRaciones}
                        onChange={(e) => setCantidadRaciones(e.target.value)}
                        placeholder="Ej: 150"
                        min="1"
                        disabled={procesando}
                    />
                </div>

                {/* Observaciones Generales */}
                <div className="formGroup">
                    <label>Observaciones / Detalles de la Jornada:</label>
                    <textarea
                        className="textareaControl"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Ej: Almuerzo general para pabellones. Un interno requiere dieta liviana."
                        disabled={procesando}
                    />
                </div>

                {/* Botón transaccional */}
                <button
                    type="submit"
                    className="btnPrincipal"
                    disabled={procesando}
                >
                    {procesando ? '🔄 Procesando Descuentos FIFO...' : '🔥 Procesar y Descontar Insumos'}
                </button>
            </form>
        </div>
    );
};

export default PlanillaDiaria;