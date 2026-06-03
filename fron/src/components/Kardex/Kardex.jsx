import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/api';
import './Kardex.css';

const Kardex = () => {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Cargar todo el historial general del Kardex al entrar a la pantalla
    useEffect(() => {
        const obtenerHistorialKardex = async () => {
            try {
                const respuesta = await axiosClient.get('/kardex'); // Tu endpoint GET
                setMovimientos(respuesta.data);
            } catch (error) {
                console.error('Error al traer historial del Kardex:', error);
            } finally {
                setLoading(false);
            }
        };
        obtenerHistorialKardex();
    }, []);

    // Función auxiliar para formatear la fecha y que quede prolija
    const formatearFecha = (fechaString) => {
        const opciones = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        return new Date(fechaString).toLocaleDateString('es-AR', opciones);
    };

    if (loading) {
        return (
            <div className="kardex-container">
                <p className="loading-kardex">Consultando bitácora oficial de movimientos...</p>
            </div>
        );
    }

    return (
        <div className="kardex-container fade-in">
            <h3 className="kardex-title">📊 Historial de Movimientos (Kardex de Auditoría)</h3>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
                Monitoreo cronológico lote por lote de todos los ingresos (Entradas) y consumos (Salidas FIFO) del depósito.
            </p>

            {movimientos.length === 0 ? (
                <p style={{ textAlign: 'center', margin: '40px 0', color: '#6c757d' }}>
                    No se registran movimientos en el historial todavía.
                </p>
            ) : (
                <table className="tabla-kardex">
                    <thead>
                        <tr>
                            <th>Fecha / Hora</th>
                            <th>Insumo</th>
                            <th>Nº Lote</th>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Precio Unit. Histórico</th>
                            <th>Detalle / Motivo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movimientos.map((mov) => {
                            // Extraemos de forma segura los datos anidados de Sequelize con encadenamiento opcional
                            const producto = mov.lote?.producto;
                            const esEntrada = mov.tipoMovimiento === 'Entrada';

                            return (
                                <tr key={mov.id}>
                                    <td className="txt-fecha">{formatearFecha(mov.fechaMovimiento)}</td>
                                    <td><strong>{producto?.nombre || 'Insumo Eliminado'}</strong></td>
                                    <td><code>{mov.lote?.numeroLote || '#' + mov.idLote}</code></td>
                                    <td>
                                        <span className={`badge-movimiento ${esEntrada ? 'badge-entrada' : 'badge-salida'}`}>
                                            {esEntrada ? '📥 Entrada' : '🔻 Salida'}
                                        </span>
                                    </td>
                                    <td>
                                        <strong>
                                            {esEntrada ? '+' : '-'}{mov.cantidad} {producto?.unidadMedida || ''}
                                        </strong>
                                    </td>
                                    <td>${mov.precioUnitarioHistorico || 0}</td>
                                    <td className="txt-detalle" title={mov.detalle}>
                                        {mov.detalle}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Kardex;