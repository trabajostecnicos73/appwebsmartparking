import { useState, useEffect } from 'react';
import Home from './views/Home';
import Login from './views/Login';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true);

  // --- REVISAR SESIÓN AL INICIAR ---
  useEffect(() => {
    const revisarSesion = () => {
      try {
        const sesion = localStorage.getItem('user_session');
        if (sesion) {
          setUsuario(JSON.parse(sesion));
        }
      } catch (error) {
        console.error("Error leyendo sesión:", error);
      } finally {
        setVerificando(false);
      }
    };
    revisarSesion();
  }, []);

  // --- FUNCIÓN PARA LOGIN ---
  const loginExitoso = (datos) => {
    try {
      setUsuario(datos);
      localStorage.setItem('user_session', JSON.stringify(datos));
    } catch (error) {
      console.error("Error guardando sesión:", error);
    }
  };

  // --- FUNCIÓN PARA LOGOUT ---
  const cerrarSesion = () => {
    try {
      localStorage.removeItem('user_session');
      setUsuario(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (verificando) {
    return (
      <div style={{ 
        backgroundColor: '#f0f4f8', 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        {/* Opcional: Podrías poner un spinner o el logo aquí */}
      </div>
    );
  }

  return (
    <>
      {usuario ? (
        // Pasamos la función cerrarSesion a Home para que el botón de salir funcione
        <Home usuario={usuario} alSalir={cerrarSesion} />
      ) : (
        <Login alLoguear={loginExitoso} />
      )}
    </>
  );
}