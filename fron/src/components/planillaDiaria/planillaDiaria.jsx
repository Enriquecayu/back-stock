import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/api'; // Tu cliente Axios con la baseURL /api
import './planillaDiaria.css'; 

const PlanillaDiaria = () => {
    const [menus, setMenus] = useState([]); 
    const [idMenuSeleccionado, setIdMenuSeleccionado] = useState(''); 
    const [cantidadRaciones, setCantidadRaciones] = useState(''); 

    // 🎯 ESTADOS TOTALMENTE SINCRO CON TU CONTROLADOR BACKEND
    const [turno, setTurno] = useState('');
    const [tipoDestinatario, setTipoDestinatario] = useState('');
    const [observaciones, setObservaciones] = useState(''); 
    
    const [procesando, setProcesando] = useState(false); 
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); 

    // 1. Obtener los menús maestros guardados en la base de datos al montar el componente
    useEffect(() => {
        const obtenerMenus = async () => {
            try {
                // Llama directo a /menus (Axios le antepone /api)
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

        // 🛡️ Validación completa en el Frontend antes de gastar ancho de banda
        if (!idMenuSeleccionado || !cantidadRaciones || parseInt(cantidadRaciones) <= 0 || !turno || !tipoDestinatario.trim()) {
            mostrarMensaje('Seleccione un menú, indique la cantidad, el turno y el destinatario.', 'error');
            return;
        }

        setProcesando(true); 
        setMensaje({ texto: '', tipo: '' }); // Limpiar respuestas previas

        try {
            // 🚀 IMPACTA DIRECTO EN: app.use('/api/planillas', planillaRoutes)
            const respuesta = await axiosClient.post('/planillas', {
                idMenu: parseInt(idMenuSeleccionado),
                cantidadRaciones: parseInt(cantidadRaciones),
                turno,                                     // 'D', 'A', 'M' o 'C'
                tipoDestinatario: tipoDestinatario.trim(), // Ej: "Pabellón de Pediatría"
                observaciones: observaciones.trim()
            });

            // Muestra el mensaje de éxito que configuramos en tu controller ("Planilla Diaria procesada con éxito...")
            mostrarMensaje(respuesta.data.mensaje, 'exito');

            // Limpiar formulario tras el éxito para evitar duplicados accidentales
            setIdMenuSeleccionado('');
            setCantidadRaciones('');
            setTurno('');
            setTipoDestinatario('');
            setObservaciones('');

        } catch (error) {
            console.error('Error al procesar la planilla:', error);
            // Captura el mensaje específico de stock insuficiente que programamos en el backend
            const msgError = error.response?.data?.mensaje || 'Error interno al procesar los insumos por FIFO.';
            mostrarMensaje(msgError, 'error');
        } finally {
            setProcesando(false); 
        }
    };

    // Función auxiliar para alertas temporales
    const mostrarMensaje = (texto, tipo) => {
        setMensaje({ texto, tipo });
        if (tipo === 'exito') {
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 6000);
        }
    };

    return (
        <div className="container">
            <h2 className="titulo">📋 Registro de Planilla Diaria (Cocina)</h2>

            {/* Banner de Feedback visual para éxito o stock insuficiente */}
            {mensaje.texto && (
                <div className={`mensaje ${mensaje.tipo === 'exito' ? 'exito' : 'error'}`}>
                    {mensaje.texto}
                </div>
            )}

            <form onSubmit={handleProcesarPlanilla}>
                {/* Selección del Menú / Receta */}
                <div className="formGroup">
                    <label>Menú / Plato a Cocinar:</label>
                    <select
                        className="inputControl"
                        value={idMenuSeleccionado}
                        onChange={(e) => setIdMenuSeleccionado(e.target.value)}
                        disabled={procesando}
                    >
                        <option value="">-- Seleccione una receta del catálogo --</option>
                        {menus.map(menu => (
                            <option key={menu.id} value={menu.id}>
                                {menu.nombre} {menu.descripcion ? `(${menu.descripcion})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selector de Turno */}
                <div className="formGroup">
                    <label>Turno de Comida:</label>
                    <select
                        className="inputControl"
                        value={turno}
                        onChange={(e) => setTurno(e.target.value)}
                        disabled={procesando}
                    >
                        <option value="">-- Seleccione el Turno --</option>
                        <option value="D">D - Desayuno</option>
                        <option value="A">A - Almuerzo</option>
                        <option value="M">M - Merienda</option>
                        <option value="C">C - Cena</option>
                    </select>
                </div>

                {/* Tipo de Destinatario (Input de texto libre) */}
                <div className="formGroup">
                    <label>Destinado a (Sector / Tipo de Pacientes):</label>
                    <input
                        type="text"
                        className="inputControl"
                        value={tipoDestinatario}
                        onChange={(e) => setTipoDestinatario(e.target.value)}
                        placeholder="Ej: Pabellón de Pediatría, Internos Comunes, Dieta Liviana"
                        disabled={procesando}
                    />
                </div>

                {/* Cantidad de Raciones */}
                <div className="formGroup">
                    <label>Cantidad de Raciones (Número de Personas):</label>
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
                        placeholder="Ej: Se cocinó con refuerzo para el personal de guardia médica."
                        disabled={procesando} 
                    />
                </div>

                {/* Botón de acción con bloqueo anti-doble clic */}
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