import React, { useState } from 'react';
import axiosClient from '../../services/api';
import './RegistroUsuarios.css';

const RegistroUsuarios = () => {
    const [nombreCompleto, setNombreCompleto] = useState(''); // 🎯 NUEVO
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rol, setRol] = useState('Cocinera');
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    const manejarRegistro = async (e) => {
        e.preventDefault();
        setMensaje({ texto: '', tipo: '' });
        setLoading(true);

        try {
            // 🎯 Ahora enviamos nombreCompleto tal como lo pide tu controlador del backend
            await axiosClient.post('/usuarios/registrar', { nombreCompleto, username, password, rol });

            setMensaje({
                texto: `¡Usuario "${username}" registrado con éxito con el rol de ${rol}!`,
                tipo: 'success'
            });
            // Limpiamos los campos
            setNombreCompleto('');
            setUsername('');
            setPassword('');
            setRol('Cocinera');
        } catch (err) {
            console.error("Detalle completo del error:", err.response?.data);
            setMensaje({
                texto: err.response?.data?.error || 'Error al intentar registrar al usuario.',
                tipo: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registro-container">
            <h3 className="registro-title">👤 Alta de Nuevo Personal Hospitalario</h3>
            <p className="registro-sub">Creación de credenciales operativas. El usuario podrá iniciar sesión de inmediato con el rol asignado.</p>

            {mensaje.texto && (
                <div className={`message-alert ${mensaje.tipo === 'success' ? 'success' : 'error'}`}>
                    {mensaje.texto}
                </div>
            )}

            <form onSubmit={manejarRegistro}>
                {/* 🎯 NUEVO CAMPO: Nombre Completo */}
                <div className="form-group">
                    <label htmlFor="reg-name">Nombre y Apellido completo:</label>
                    <input
                        id="reg-name"
                        type="text"
                        className="form-input"
                        placeholder="Ej: Marta Gómez o Luis Sánchez"
                        value={nombreCompleto}
                        onChange={(e) => setNombreCompleto(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="reg-user">Nombre de usuario único (Login):</label>
                    <input
                        id="reg-user"
                        type="text"
                        className="form-input"
                        placeholder="Ej: marta.cocina o carmen.juarez"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="reg-pass">Contraseña de fábrica:</label>
                    <input
                        id="reg-pass"
                        type="password"
                        className="form-input"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="reg-rol">Rol asignado en el sistema:</label>
                    <select
                        id="reg-rol"
                        className="form-input"
                        value={rol}
                        onChange={(e) => setRol(e.target.value)}
                        disabled={loading}
                    >
                        <option value="Cocinera">🍳 Cocinera (Solo Registros Diarios y Menús)</option>
                        <option value="Administrador">🛡️ Administrador (Acceso Total y Auditoría)</option>
                    </select>
                </div>

                <button type="submit" className="btn-submit-registro" disabled={loading}>
                    {loading ? '💾 Guardando en la base de datos...' : 'Registrar y Habilitar Usuario'}
                </button>
            </form>
        </div>
    );
};

export default RegistroUsuarios;