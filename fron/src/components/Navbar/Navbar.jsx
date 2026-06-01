import React from 'react';
import './Navbar.css'; // Importación obligatoria del CSS externo del componente

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">🛡️ Proyecto Stock</div>
            <ul className="navbar-menu">
                <li className="navbar-item">Inventario</li>
                <li className="navbar-item">Movimientos (Kardex)</li>
                <li className="navbar-item">Planilla Raciones</li>
            </ul>
        </nav>
    );
};

export default Navbar;