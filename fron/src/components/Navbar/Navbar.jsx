// src/components/Navbar/Navbar.jsx
import React, { useState } from 'react';
import './Navbar.css';

const Navbar = ({ seccionActual, setSeccionActual, rolActual, usuarioLogueado, onLogout }) => {
    // Estado para controlar si el menú hamburguesa está abierto o cerrado en el celular
    const [menuAbierto, setMenuAbierto] = useState(false);

    const cambiarSeccion = (seccion) => {
        setSeccionActual(seccion);
        setMenuAbierto(false); // Cierra el menú automáticamente al hacer clic en una opción
    };

    return (
        <nav className="navbar">
            <div className="navbar-header-mobile">
                <div className="navbar-logo">
                    📋 Control De Stock <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>({rolActual})</span>
                </div>
                
                {/* Botón de las 3 rayitas (Hamburguesa) visible solo en celular */}
                <button className="navbar-toggle" onClick={() => setMenuAbierto(!menuAbierto)}>
                    {menuAbierto ? '✕' : '☰'}
                </button>
            </div>

            {/* Lista de enlaces (en celular se convierte en menú desplegable gracias a la clase open) */}
            <ul className={`navbar-links ${menuAbierto ? 'open' : ''}`}>
                <li
                    className={seccionActual === 'inventario' ? 'active' : ''}
                    onClick={() => cambiarSeccion('inventario')}
                >
                    Inventario
                </li>

                <li
                    className={seccionActual === 'raciones' ? 'active' : ''}
                    onClick={() => cambiarSeccion('raciones')}
                >
                    Planilla Raciones
                </li>

                {rolActual === 'Administrador' && (
                    <>
                        <li
                            className={seccionActual === 'registros' ? 'active' : ''}
                            onClick={() => cambiarSeccion('registros')}
                        >
                            Registrar Insumos / Lotes
                        </li>
                        <li
                            className={seccionActual === 'kardex' ? 'active' : ''}
                            onClick={() => cambiarSeccion('kardex')}
                        >
                            Movimientos (Kardex)
                        </li>
                        <li
                            className={seccionActual === 'usuarios' ? 'active' : ''}
                            onClick={() => cambiarSeccion('usuarios')}
                        >
                            Gestionar Personal
                        </li>
                    </>
                )}

                <li className="navbar-user-box" style={{ backgroundColor: '#004085', cursor: 'default' }}>
                    👤 {usuarioLogueado}
                </li>
                <li
                    className="navbar-logout-btn"
                    style={{ backgroundColor: '#dc3545', fontWeight: 'bold' }}
                    onClick={() => { setMenuAbierto(false); onLogout(); }}
                >
                    Salir
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;