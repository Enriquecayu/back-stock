import React from 'react';
import Navbar from './components/Navbar/Navbar';

function App() {
  return (
    <div>
      <Navbar />
      <main style={{ padding: '20px' }}>
        <h2>Bienvenido al Sistema de Gestión de Inventario</h2>
        <p>Seleccione un módulo en la barra superior para comenzar.</p>
      </main>
    </div>
  );
}

export default App;