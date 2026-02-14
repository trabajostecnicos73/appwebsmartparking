import { useState } from "react";
import styles from "./Login.module.css";
import logo from "../assets/smartparkin-logo.png";
import api from "../api/config.js";
// Usamos únicamente la librería instalada
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export default function Login({ alLoguear }) {
  const [vista, setVista] = useState("login");
  const [cargando, setCargando] = useState(false);
  
  const [datos, setDatos] = useState({
    nombre: "",
    correo: "",
    password: "",
    confirmarPassword: "",
    telefono: ""
  });

  const manejarCambio = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const enviarFormulario = async (e) => {
    e.preventDefault();
    setCargando(true);

    let url = "";
    let metodo = "post";

    if (vista === "login") url = "/auth/login";
    if (vista === "registro") url = "/auth/registro";
    if (vista === "recuperar") {
        url = "/auth/recuperar-password";
        metodo = "put";
    }

    try {
      const respuesta = await api[metodo](url, datos);
      
      if (respuesta.data.success) {
        if (vista === "recuperar") {
            alert("Contraseña actualizada con éxito.");
            setVista("login");
        } else {
            alLoguear(respuesta.data.usuario);
        }
      }
    } catch (error) {
      alert(error.response?.data?.mensaje || "Error en la operación");
    } finally {
      setCargando(false);
    }
  };

  const clavesCoinciden = datos.password === datos.confirmarPassword && datos.password !== "";

  return (
    <div className={styles.contenedor}>
      <div className={styles.tarjetaLogin}>
        <header className={styles.header}>
          <img src={logo} alt="SmartParkin Logo" className={styles.logo} />
          <h1 className={styles.titulo}>
            {vista === "login" && "Bienvenido"}
            {vista === "registro" && "Crea tu cuenta"}
            {vista === "recuperar" && "Recuperar"}
          </h1>
        </header>

        <form className={styles.formulario} onSubmit={enviarFormulario}>
          {vista === "registro" && (
            <div className={styles.inputGrupo}>
              <label><User size={16} /> Nombre Completo</label>
              <input type="text" name="nombre" className={styles.input} value={datos.nombre} onChange={manejarCambio} required />
            </div>
          )}

          <div className={styles.inputGrupo}>
            <label><Mail size={16} /> Correo Electrónico</label>
            <input type="email" name="correo" className={styles.input} value={datos.correo} onChange={manejarCambio} required />
          </div>

          {(vista === "registro" || vista === "recuperar") && (
            <div className={styles.inputGrupo}>
              <label><Phone size={16} /> Teléfono</label>
              <input type="text" name="telefono" className={styles.input} value={datos.telefono} onChange={manejarCambio} required />
            </div>
          )}

          <div className={styles.inputGrupo}>
            <label><Lock size={16} /> {vista === "recuperar" ? "Nueva Clave" : "Clave"}</label>
            <input type="password" name="password" className={styles.input} value={datos.password} onChange={manejarCambio} required />
          </div>

          {vista === "recuperar" && (
            <div className={styles.inputGrupo}>
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><Lock size={16} /> Confirmar Clave</span>
                {datos.confirmarPassword && (
                    clavesCoinciden 
                    ? <CheckCircle2 size={18} color="#10b981" /> // Verde esmeralda de la librería
                    : <AlertCircle size={18} color="#ef4444" />   // Rojo alerta de la librería
                )}
              </label>
              <input type="password" name="confirmarPassword" className={styles.input} value={datos.confirmarPassword} onChange={manejarCambio} required />
            </div>
          )}

          <button 
            type="submit" 
            className={styles.botonLogin} 
            disabled={cargando || (vista === "recuperar" && !clavesCoinciden)}
          >
            {cargando ? "Cargando..." : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {vista === "login" && "Entrar"}
                {vista === "registro" && "Registrarme"}
                {vista === "recuperar" && "Actualizar"}
                <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <footer className={styles.footer}>
          {vista === "login" ? (
            <>
              <p>¿No tienes cuenta? <span onClick={() => setVista("registro")} className={styles.linkToggle}>Regístrate</span></p>
              <p style={{marginTop: '10px'}}><span onClick={() => setVista("recuperar")} className={styles.linkToggle}>¿Olvidaste tu clave?</span></p>
            </>
          ) : (
            <p><span onClick={() => setVista("login")} className={styles.linkToggle}><ArrowLeft size={14} /> Volver</span></p>
          )}
        </footer>
      </div>
    </div>
  );
}