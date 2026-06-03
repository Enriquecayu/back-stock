import React from 'react';
import './Navbar.css'; // Tus estilos actuales del Navbar

const Navbar = ({ seccionActual, setSeccionActual }) => {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                🛡️ Proyecto Stock
            </div>
            <ul className="navbar-links">
                <li
                    className={seccionActual === 'inventario' ? 'active' : ''}
                    onClick={() => setSeccionActual('inventario')}
                >
                    Inventario
                </li>
                <li
                    className={seccionActual === 'registros' ? 'active' : ''}
                    onClick={() => setSeccionActual('registros')}
                >
                    Registros
                </li>
                <li
                    className={seccionActual === 'kardex' ? 'active' : ''}
                    onClick={() => setSeccionActual('kardex')}
                >
                    Movimientos (Kardex)
                </li>
                <li
                    className={seccionActual === 'raciones' ? 'active' : ''}
                    onClick={() => setSeccionActual('raciones')}
                >
                    Planilla Raciones
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;