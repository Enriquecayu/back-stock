import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/api'; // Tu cliente Axios con la baseURL /api
import './planillaDiaria.css';

const PlanillaDiaria = () => {
    const [menus, setMenus] = useState([]);
    const [sectores, setSectores] = useState([]);

    const [idMenuSeleccionado, setIdMenuSeleccionado] = useState('');
    const [cantidadRaciones, setCantidadRaciones] = useState('');
    const [turno, setTurno] = useState('');
    const [idSector, setIdSector] = useState('');
    const [observaciones, setObservaciones] = useState('');

    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // 🔒 LEER EL ROL DIRECTAMENTE DEL LOCALSTORAGE AL ARRANCAR
    const [userRol, setUserRol] = useState(localStorage.getItem('rol') || '');
    const [mostrarModal, setMostrarModal] = useState(false);
    const [nuevoSectorNombre, setNuevoSectorNombre] = useState('');
    const [guardandoSector, setGuardandoSector] = useState(false);

    // Función para traer los sectores desde la API
    const obtenerSectoresDeAPI = async () => {
        try {
            const resSectores = await axiosClient.get('/sectores');
            setSectores(resSectores.data);
        } catch (error) {
            console.error('Error al traer sectores:', error);
        }
    };

    // Carga inicial de menús y sectores maestros
    useEffect(() => {
        const obtenerDatosIniciales = async () => {
            try {
                const resMenus = await axiosClient.get('/menus');
                setMenus(resMenus.data);

                await obtenerSectoresDeAPI();
            } catch (error) {
                console.error('Error al cargar los catálogos del sistema:', error);
                mostrarMensaje('Error al cargar los catálogos del sistema.', 'error');
            }
        };
        obtenerDatosIniciales();
    }, []);

    // Procesar el envío de la planilla diaria con descuento FIFO
    const handleProcesarPlanilla = async (e) => {
        e.preventDefault();

        if (!idMenuSeleccionado || !cantidadRaciones || parseInt(cantidadRaciones) <= 0 || !turno || !idSector) {
            mostrarMensaje('Seleccione un menú, indique la cantidad, el turno y el sector de destino.', 'error');
            return;
        }

        setProcesando(true);
        setMensaje({ texto: '', tipo: '' });

        try {
            const respuesta = await axiosClient.post('/planillas', {
                idMenu: parseInt(idMenuSeleccionado),
                cantidadRaciones: parseInt(cantidadRaciones),
                turno,
                idSector: parseInt(idSector), // Enviamos el ID numérico exacto
                observaciones: observaciones.trim()
            });

            mostrarMensaje(respuesta.data.mensaje, 'exito');

            // Limpiar formulario tras el éxito
            setIdMenuSeleccionado('');
            setCantidadRaciones('');
            setTurno('');
            setIdSector('');
            setObservaciones('');

        } catch (error) {
            console.error('Error al procesar la planilla:', error);
            const msgError = error.response?.data?.mensaje || 'Error interno al procesar la planilla.';
            mostrarMensaje(msgError, 'error');
        } finally {
            setProcesando(false);
        }
    };

    // Crear nuevo sector (Función exclusiva de la Administradora)
    const handleCrearSector = async (e) => {
        e.preventDefault();
        if (!nuevoSectorNombre.trim()) return;

        setGuardandoSector(true);
        try {
            const res = await axiosClient.post('/sectores', { nombre: nuevoSectorNombre.trim() });

            mostrarMensaje(res.data.mensaje, 'exito');
            setNuevoSectorNombre('');
            setMostrarModal(false);

            // Refrescamos la lista de sectores al instante
            await obtenerSectoresDeAPI();
        } catch (error) {
            console.error('Error al crear sector:', error);
            const msgError = error.response?.data?.mensaje || 'Error al crear el sector.';
            alert(msgError);
        } finally {
            setGuardandoSector(false);
        }
    };

    const mostrarMensaje = (texto, tipo) => {
        setMensaje({ texto, tipo });
        if (tipo === 'exito') {
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 6000);
        }
    };

    return (
        <div className="container">
            <h2 className="titulo">📋 Registro de Planilla Diaria (Cocina)</h2>

            {/* Banner de Feedback */}
            {mensaje.texto && (
                <div className={`mensaje ${mensaje.tipo === 'exito' ? 'exito' : 'error'}`}>
                    {mensaje.texto}
                </div>
            )}

            <form onSubmit={handleProcesarPlanilla}>
                {/* Selección del Menú */}
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

                {/* Selector de Sectores + Botón Condicional */}
                <div className="formGroup">
                    <div className="labelContainer">
                        <label>Destinado a (Sector / Tipo de Pacientes):</label>

                        {/* 🛡️ Solo se renderiza si el rol guardado es 'Administrador' */}
                        {userRol === 'Administrador' && (
                            <button
                                type="button"
                                className="btnCrearDestino"
                                onClick={() => setMostrarModal(true)}
                            >
                                ➕ Crear Nuevo Destino
                            </button>
                        )}
                    </div>

                    <select
                        className="inputControl"
                        value={idSector}
                        onChange={(e) => setIdSector(e.target.value)}
                        disabled={procesando}
                    >
                        <option value="">-- Seleccione el Sector Autorizado --</option>
                        {sectores.map(sec => (
                            <option key={sec.id} value={sec.id}>
                                {sec.nombre}
                            </option>
                        ))}
                    </select>
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

                {/* Observaciones */}
                <div className="formGroup">
                    <label>Observaciones / Detalles de la Jornada:</label>
                    <textarea
                        className="textareaControl"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Ej: Se cocinó con refuerzo..."
                        disabled={procesando}
                    />
                </div>

                <button type="submit" className="btnPrincipal" disabled={procesando}>
                    {procesando ? '🔄 Procesando Descuentos FIFO...' : '🔥 Procesar y Descontar Insumos'}
                </button>
            </form>

            {/* 🪟 MODAL FLOTANTE DE REGISTRO */}
            {mostrarModal && (
                <div className="modalOverlay">
                    <div className="modalContent">
                        <h3>➕ Registrar Nuevo Sector o Dieta</h3>
                        <form onSubmit={handleCrearSector}>
                            <div className="formGroup">
                                <label>Nombre del Sector / Destinatario:</label>
                                <input
                                    type="text"
                                    className="inputControl"
                                    value={nuevoSectorNombre}
                                    onChange={(e) => setNuevoSectorNombre(e.target.value)}
                                    placeholder="Ej: Pediatría, Internados Comunes"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="modalAcciones">
                                <button
                                    type="button"
                                    className="btnCancelar"
                                    onClick={() => { setMostrarModal(false); setNuevoSectorNombre(''); }}
                                    disabled={guardandoSector}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btnGuardar"
                                    disabled={guardandoSector || !nuevoSectorNombre.trim()}
                                >
                                    {guardandoSector ? 'Guardando...' : 'Guardar Sector'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanillaDiaria;