// src/App.jsx
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar/Navbar';
import ProductosForm from './components/ProductosForm/ProductosForm';
import LotesForm from './components/LotesForm/LotesForm';
import Inventario from './components/Inventario/Inventario';
import ConsumosForm from './components/ConsumosForm/ConsumosForm';
import Kardex from './components/Kardex/Kardex';
import GestionMenus from './components/gestionMenus/gestionMenus.jsx';
import PlanillaDiaria from './components/planillaDiaria/planillaDiaria.jsx';
import ExportarPlanilla from './components/exportarPlanilla/ExportarPlanilla.jsx';
import Login from './components/Login/Login.jsx';
import RegistroUsuarios from './components/RegistroUsuarios/RegistroUsuarios.jsx';
import './App.css';

function App() {
  // --- ESTADOS DE AUTENTICACIÓN Y ROLES ---
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [rolActual, setRolActual] = useState(localStorage.getItem('rol') || null);
  const [usuarioLogueado, setUsuarioLogueado] = useState(localStorage.getItem('usuario') || null);

  // --- ESTADOS DE NAVEGACIÓN ORIGINALES ---
  const [seccionActual, setSeccionActual] = useState('inventario');
  const [subVistaRegistro, setSubVistaRegistro] = useState('producto');
  const [subVistaRaciones, setSubVistaRaciones] = useState('planilla');

  // Sincronizar y auditar accesos indebidos en caliente
  useEffect(() => {
    if (token && rolActual === 'Cocinera') {
      if (['registros', 'kardex', 'usuarios'].includes(seccionActual)) {
        setSeccionActual('inventario');
      }
    }
  }, [seccionActual, rolActual, token]);

  // Manejador del Login exitoso
  const manejarLoginExitoso = (rol, usuario) => {
    setToken(localStorage.getItem('token'));
    setRolActual(rol);
    setUsuarioLogueado(usuario);
    setSeccionActual('inventario');
  };

  // Manejador para Cerrar Sesión
  const manejarLogout = () => {
    localStorage.clear();
    setToken(null);
    setRolActual(null);
    setUsuarioLogueado(null);
  };

  // 🔒 CONTROL DE ACCESO PRINCIPAL: Si no hay token, solo se muestra el Login
  if (!token) {
    return <Login onLoginSuccess={manejarLoginExitoso} />;
  }

  return (
    <div>
      <Navbar
        seccionActual={seccionActual}
        setSeccionActual={setSeccionActual}
        rolActual={rolActual}
        usuarioLogueado={usuarioLogueado}
        onLogout={manejarLogout}
      />

      <main className="main-content">

        {/* --- PANTALLA 1: INVENTARIO (PÚBLICO PARA AMBOS ROLES) --- */}
        {seccionActual === 'inventario' && <Inventario />}

        {/* --- PANTALLA 2: REGISTROS DE INSUMOS/LOTES (SÓLO ADMINISTRADOR) --- */}
        {seccionActual === 'registros' && rolActual === 'Administrador' && (
          <div>
            <div className="control-buttons-container">
              <button
                className={`btn-nav-form ${subVistaRegistro === 'producto' ? 'active-producto' : ''}`}
                onClick={() => setSubVistaRegistro('producto')}
              >
                📦 Crear Nuevo Producto
              </button>
              <button
                className={`btn-nav-form ${subVistaRegistro === 'lote' ? 'active-lote' : ''}`}
                onClick={() => setSubVistaRegistro('lote')}
              >
                📥 Cargar Entrada (Lote Nuevo)
              </button>
              <button
                className={`btn-nav-form ${subVistaRegistro === 'consumo' ? 'active-consumo' : ''}`}
                onClick={() => setSubVistaRegistro('consumo')}
              >
                🔥 Registrar Consumo
              </button>
            </div>

            <div className="form-render-box">
              {subVistaRegistro === 'producto' && <ProductosForm />}
              {subVistaRegistro === 'lote' && <LotesForm />}
              {subVistaRegistro === 'consumo' && <ConsumosForm />}
            </div>
          </div>
        )}

        {/* --- PANTALLA 3: HISTORIAL KARDEX (SÓLO ADMINISTRADOR) --- */}
        {seccionActual === 'kardex' && rolActual === 'Administrador' && <Kardex />}

        {/* --- PANTALLA 4: GESTIÓN DE PERSONAL (SÓLO ADMINISTRADOR) --- */}
        {seccionActual === 'usuarios' && rolActual === 'Administrador' && <RegistroUsuarios />}

        {/* --- PANTALLA 5: SECCIÓN RACIONES (ADAPTABLE POR ROL) --- */}
        {seccionActual === 'raciones' && (
          <div>
            <div className="control-buttons-container">

              {/* 🔓 MODIFICADO: Quitamos el filtro de Administrador para permitir configurar recetas a la Cocinera */}
              <button
                className={`btn-nav-form ${subVistaRaciones === 'receta' ? 'active-producto' : ''}`}
                onClick={() => setSubVistaRaciones('receta')}
              >
                🍳 Configurar Recetas
              </button>

              <button
                className={`btn-nav-form ${subVistaRaciones === 'planilla' ? 'active-lote' : ''}`}
                onClick={() => setSubVistaRaciones('planilla')}
              >
                📋 Cargar Planilla Diaria
              </button>

              {/* 🔒 SE MANTIENE PRIVADO: Solo el Administrador ve la descarga contable */}
              {rolActual === 'Administrador' && (
                <button
                  className={`btn-nav-form ${subVistaRaciones === 'excel-mensual' ? 'active-producto' : ''}`}
                  onClick={() => setSubVistaRaciones('excel-mensual')}
                >
                  📊 Descargar Cierre Mensual
                </button>
              )}
            </div>

            <div className="form-render-box">
              {/* 🔓 MODIFICADO: Quitamos 'rolActual === "Administrador"' del renderizado */}
              {subVistaRaciones === 'receta' && <GestionMenus />}

              {subVistaRaciones === 'planilla' && <PlanillaDiaria />}

              {/* 🔒 SE MANTIENE PRIVADO */}
              {subVistaRaciones === 'excel-mensual' && rolActual === 'Administrador' && <ExportarPlanilla />}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;