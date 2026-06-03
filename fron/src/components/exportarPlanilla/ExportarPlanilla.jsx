import React, { useState, useEffect } from 'react'; // 🎯 Sumamos useEffect
import axiosClient from '../../services/api'; 
import './exportarPlanilla.css';

const ExportarPlanilla = () => {
    const [mes, setMes] = useState('');
    const [anio, setAnio] = useState(new Date().getFullYear().toString());
    const [categoria, setCategoria] = useState('');
    const [categoriasDisponibles, setCategoriasDisponibles] = useState([]); // 🎯 Ahora empieza vacío
    const [descargando, setDescargando] = useState(false);
    const [cargandoCategorias, setCargandoCategorias] = useState(true); // Estado de carga inicial
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // 🚀 NUEVO: Buscar las categorías reales de la base de datos al cargar el componente
    useEffect(() => {
        const cargarCategorias = async () => {
            try {
                const respuesta = await axiosClient.get('/productos/categorias-existentes');
                setCategoriasDisponibles(respuesta.data);
            } catch (error) {
                console.error('Error al traer las categorías:', error);
                setMensaje({ 
                    texto: 'No se pudieron cargar las categorías desde el servidor.', 
                    tipo: 'error' 
                });
            } finally {
                setCargandoCategorias(false);
            }
        };

        cargarCategorias();
    }, []);

    const handleDescargarExcel = async (e) => {
        e.preventDefault();
        if (!mes || !anio || !categoria) {
            setMensaje({ texto: 'Por favor, seleccione la categoría, el mes y el año.', tipo: 'error' });
            return;
        }

        setMensaje({ texto: '', tipo: '' });
        setDescargando(true);

        try {
            const respuesta = await axiosClient.get('/productos/reporte-mensual/excel', {
                params: { mes, anio, categoria },
                responseType: 'blob' 
            });

            const blob = new Blob([respuesta.data], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            const urlDescarga = window.URL.createObjectURL(blob);
            
            const enlaceTemporal = document.createElement('a');
            enlaceTemporal.href = urlDescarga;
            enlaceTemporal.setAttribute('download', `Planilla_Mensual_${categoria.replace(/ /g, "_")}_M${mes}_A${anio}.xlsx`);
            document.body.appendChild(enlaceTemporal);
            enlaceTemporal.click();
            
            document.body.removeChild(enlaceTemporal);
            window.URL.revokeObjectURL(urlDescarga);

            setMensaje({ texto: '¡Planilla generada y descargada con éxito!', tipo: 'exito' });
        } catch (error) {
            console.error('Error al descargar el binario de Excel:', error);
            setMensaje({ 
                texto: 'No se encontraron movimientos en el Kardex para esos filtros o el servidor falló.', 
                tipo: 'error' 
            });
        } finally {
            setDescargando(false);
        }
    };

    return (
        <div className="export-container">
            <h2 className="export-titulo">📂 Exportación Oficial de Planillas</h2>
            <p className="export-sub">Generá el cierre mensual de consumo por categorías en formato Excel (.xlsx)</p>

            {mensaje.texto && (
                <div className={`export-mensaje ${mensaje.tipo}`}>
                    {mensaje.texto}
                </div>
            )}

            <form onSubmit={handleDescargarExcel} className="export-form">
                {/* Selector de Categoría Dinámico */}
                <div className="export-group">
                    <label>Categoría / Rubro de Insumos:</label>
                    <select 
                        className="export-select" 
                        value={categoria} 
                        onChange={(e) => setCategoria(e.target.value)}
                        disabled={descargando || cargandoCategorias}
                    >
                        {cargandoCategorias ? (
                            <option value="">Cargando sectores disponibles...</option>
                        ) : (
                            <>
                                <option value="">-- Elija el Sector --</option>
                                {categoriasDisponibles.map((cat, idx) => (
                                    <option key={idx} value={cat}>{cat}</option>
                                ))}
                            </>
                        )}
                    </select>
                </div>

                <div className="export-row-fechas">
                    <div className="export-group">
                        <label>Mes de Consumo:</label>
                        <select className="export-select" value={mes} onChange={(e) => setMes(e.target.value)} disabled={descargando}>
                            <option value="">-- Elija el Mes --</option>
                            <option value="1">Enero</option>
                            <option value="2">Febrero</option>
                            <option value="3">Marzo</option>
                            <option value="4">Abril</option>
                            <option value="5">Mayo</option>
                            <option value="6">Junio</option>
                            <option value="7">Julio</option>
                            <option value="8">Agosto</option>
                            <option value="9">Septiembre</option>
                            <option value="10">Octubre</option>
                            <option value="11">Noviembre</option>
                            <option value="12">Diciembre</option>
                        </select>
                    </div>

                    <div className="export-group">
                        <label>Año:</label>
                        <select className="export-select" value={anio} onChange={(e) => setAnio(e.target.value)} disabled={descargando}>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                        </select>
                    </div>
                </div>

                <button type="submit" className="export-btn" disabled={descargando || cargandoCategorias}>
                    {descargando ? '🔄 Compilando y Dibujando celdas...' : '📊 Generar y Descargar Excel'}
                </button>
            </form>
        </div>
    );
};

export default ExportarPlanilla;