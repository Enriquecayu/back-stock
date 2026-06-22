// src/components/Navbar/Navbar.jsx
import React from 'react';
import './Navbar.css';

const Navbar = ({ seccionActual, setSeccionActual, rolActual, usuarioLogueado, onLogout }) => {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                📋 Control De Stock <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>({rolActual})</span>
            </div>

            <ul className="navbar-links">
                {/* --- SECCIONES PARA AMBOS ROLES --- */}
                <li
                    className={seccionActual === 'inventario' ? 'active' : ''}
                    onClick={() => setSeccionActual('inventario')}
                >
                    Inventario
                </li>

                <li
                    className={seccionActual === 'raciones' ? 'active' : ''}
                    onClick={() => setSeccionActual('raciones')}
                >
                    Planilla Raciones
                </li>

                {/* --- SECCIONES EXCLUSIVAS PARA EL ADMINISTRADOR --- */}
                {rolActual === 'Administrador' && (
                    <>
                        <li
                            className={seccionActual === 'registros' ? 'active' : ''}
                            onClick={() => setSeccionActual('registros')}
                        >
                            Registrar Insumos / Lotes
                        </li>
                        <li
                            className={seccionActual === 'kardex' ? 'active' : ''}
                            onClick={() => setSeccionActual('kardex')}
                        >
                            Movimientos (Kardex)
                        </li>
                        <li
                            className={seccionActual === 'usuarios' ? 'active' : ''}
                            onClick={() => setSeccionActual('usuarios')}
                        >
                            Gestionar Personal
                        </li>
                    </>
                )}

                {/* --- PERFIL Y CERRAR SESIÓN --- */}
                <li className="navbar-user-box" style={{ backgroundColor: '#004085', cursor: 'default' }}>
                    👤 {usuarioLogueado}
                </li>
                <li
                    className="navbar-logout-btn"
                    style={{ backgroundColor: '#dc3545', fontWeight: 'bold' }}
                    onClick={onLogout}
                >
                    Salir
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;