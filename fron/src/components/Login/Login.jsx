import React, { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile'; // 1. Importamos el componente
import axiosClient from '../../services/api';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [tokenTurnstile, setTokenTurnstile] = useState(''); // 2. Estado para el token del captcha
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const manejarSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 3. Validar que el usuario haya pasado el Turnstile antes de disparar la API
        if (!tokenTurnstile) {
            setError('Por favor, completá la verificación de seguridad de Cloudflare.');
            return;
        }

        setLoading(true);

        try {
            // 4. Mandamos username, password Y el tokenTurnstile al backend
            const respuesta = await axiosClient.post('/usuarios/login', {
                username,
                password,
                tokenTurnstile
            });

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

                    {/* 5. Widget de Cloudflare Turnstile integrado de forma prolija */}
                    <div style={{ margin: '15px 0', display: 'flex', justifyContent: 'center' }}>
                        <Turnstile
                            siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY}
                            onSuccess={(token) => setTokenTurnstile(token)}
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