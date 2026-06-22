import React, { useState } from 'react';
import axiosClient from '../../services/api';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const manejarSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const respuesta = await axiosClient.post('/usuarios/login', { username, password });

            // Guardamos las llaves en el localStorage
            localStorage.setItem('token', respuesta.data.token);
            localStorage.setItem('usuario', respuesta.data.usuario.username);
            localStorage.setItem('rol', respuesta.data.usuario.rol);

            // Le avisamos al App.jsx que el usuario ya está adentro
            onLoginSuccess(respuesta.data.usuario.rol, respuesta.data.usuario.username);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Error al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="login-header">
                    <span className="login-icon">🛡️</span>
                    <h2></h2>
                    <p>Control de Stock e Insumos Hospitalarios</p>
                </div>

                {error && <div className="login-error-alert">{error}</div>}

                <form onSubmit={manejarSubmit} className="login-form">
                    <div className="login-group">
                        <label htmlFor="user">Usuario:</label>
                        <input
                            id="user"
                            type="text"
                            placeholder="Ej: marta.cocina o henry.admin"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="login-group">
                        <label htmlFor="pass">Contraseña:</label>
                        <input
                            id="pass"
                            type="password"
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="login-btn-submit" disabled={loading}>
                        {loading ? '🔐 Verificando credenciales...' : 'Ingresar al Sistema'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;