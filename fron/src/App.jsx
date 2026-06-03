import React, { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import ProductosForm from './components/ProductosForm/ProductosForm';
import LotesForm from './components/LotesForm/LotesForm';
import Inventario from './components/Inventario/Inventario';
import ConsumosForm from './components/ConsumosForm/ConsumosForm';
import Kardex from './components/Kardex/Kardex';
import GestionMenus from './components/gestionMenus/gestionMenus.jsx';
import PlanillaDiaria from './components/planillaDiaria/planillaDiaria.jsx'; // 🎯 1. IMPORTAMOS TU NUEVO COMPONENTE ACÁ
import './App.css';

function App() {
  // 1. Estado principal para la barra de navegación superior
  const [seccionActual, setSeccionActual] = useState('inventario');

  // 2. Estado secundario para la botonera interna de la sección Registros
  const [subVistaRegistro, setSubVistaRegistro] = useState('producto');

  // 3. Estado secundario para la botonera interna de la sección Raciones
  const [subVistaRaciones, setSubVistaRaciones] = useState('receta');

  return (
    <div>
      {/* Pasamos el estado al Navbar para que controle las pantallas superiores */}
      <Navbar seccionActual={seccionActual} setSeccionActual={setSeccionActual} />

      <main className="main-content">

        {/* --- PANTALLA 1: INVENTARIO --- */}
        {seccionActual === 'inventario' && (
          <Inventario />
        )}

        {/* --- PANTALLA 2: REGISTROS --- */}
        {seccionActual === 'registros' && (
          <div className="fade-in">
            <div className="control-buttons-container">
              <button
                className={`btn-nav-form ${subVistaRegistro === 'producto' ? 'active-producto' : ''}`}
                onClick={() => setSubVistaRegistro('producto')}
              >
                📝 Registrar Producto
              </button>

              <button
                className={`btn-nav-form ${subVistaRegistro === 'lote' ? 'active-lote' : ''}`}
                onClick={() => setSubVistaRegistro('lote')}
              >
                📥 Cargar Lote
              </button>

              <button
                className={`btn-nav-form ${subVistaRegistro === 'consumo' ? 'active-lote' : ''}`}
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

        {/* --- PANTALLA 3: KARDEX --- */}
        {seccionActual === 'kardex' && (
          <Kardex />
        )}

        {/* --- PANTALLA 4: PLANILLA DE RACIONES --- */}
        {seccionActual === 'raciones' && (
          <div className="fade-in">
            {/* Botonera interna exclusiva de la sección de Raciones */}
            <div className="control-buttons-container">
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
            </div>

            {/* Renderizado interno de sub-vistas */}
            <div className="form-render-box">
              {subVistaRaciones === 'receta' && <GestionMenus />}

              {/* 🎯 2. REEMPLAZADO EL DIV DE DESARROLLO POR TU COMPONENTE REAL CON AXIOS */}
              {subVistaRaciones === 'planilla' && <PlanillaDiaria />}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;