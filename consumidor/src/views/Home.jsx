import { useState, useEffect } from "react";
import api from "../api/config.js";
import {
  ChevronDown,
  Car,
  Bike,
  Truck,
  User as UserIcon,
  LogOut,
  ArrowLeft,
  Hash,
  Palette,
  ClipboardList,
  Clock,
  Trash2,
  MapPinned,
  Activity,
  History,
} from "lucide-react";
import styles from "./Home.module.css";

// Agregamos alSalir a las propiedades recibidas
export default function Home({ usuario, alSalir }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [categoria, setCategoria] = useState(null);
  const [placa, setPlaca] = useState("");
  const [color, setColor] = useState("");
  const [paso, setPaso] = useState(1); // 1: Inicio/Vehículo, 2: Placa/Color, 3: Perfil
  const [cargando, setCargando] = useState(false);
  const [misReservas, setMisReservas] = useState([]);
  const [nuevoCorreo, setNuevoCorreo] = useState(usuario.correo || "");
  const [nuevoTelefono, setNuevoTelefono] = useState(usuario.telefono || "");
  const [historialVisible, setHistorialVisible] = useState(false);
  const [registrosHistorial, setRegistrosHistorial] = useState(10);

  useEffect(() => {
    if (usuario?.id_usuario) {
      cargarHistorial();

      // Polling cada 10 segundos para actualizar estados en tiempo real
      // SOLO si el usuario NO está en la vista de perfil
      if (paso !== 3) {
        const intervalo = setInterval(() => {
          cargarHistorial();
        }, 10000);

        // Limpiar intervalo al desmontar componente o cambiar de paso
        return () => clearInterval(intervalo);
      }
    }
  }, [usuario, paso]); // Agregamos 'paso' como dependencia

  const cargarHistorial = async () => {
    try {
      const respuesta = await api.get(`/reservas/${usuario.id_usuario}`);
      if (respuesta.data.success) {
        setMisReservas(respuesta.data.reservas);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
    }
  };

  const guardarCambiosPerfil = async () => {
    try {
      const respuesta = await api.put("/usuarios/actualizar", {
        id_usuario: usuario.id_usuario,
        correo: nuevoCorreo,
        telefono: nuevoTelefono,
      });
      if (respuesta.data.success) {
        alert(
          "Datos actualizados. La sesión se reiniciará para aplicar cambios.",
        );
        window.location.reload();
      }
    } catch (error) {
      alert("Error al actualizar los datos.");
    }
  };

  const opciones = [
    {
      id: "Liviano",
      nombre: "Livianos",
      descripcion: "Carros y Camionetas",
      icono: <Car size={24} />,
    },
    {
      id: "Moto",
      nombre: "Motos",
      descripcion: "Motocicletas",
      icono: <Bike size={24} />,
    },
    {
      id: "Otro",
      nombre: "Otros",
      descripcion: "Pequeños camiones",
      icono: <Truck size={24} />,
    },
  ];

  const manejarCambio = (e, setter) => {
    setter(e.target.value.toUpperCase());
  };

  const reiniciar = () => {
    setCategoria(null);
    setPlaca("");
    setColor("");
    setPaso(1);
    cargarHistorial();
  };

  const confirmarReserva = async () => {
    setCargando(true);
    try {
      const datosReserva = {
        id_usuario: usuario.id_usuario,
        tipo_vehiculo: categoria.id,
        placa: placa,
        color: color,
        fecha_registro: new Date().toISOString().slice(0, 19).replace("T", " "),
      };

      const respuesta = await api.post("/reservas", datosReserva);

      if (respuesta.status === 200) {
        alert("¡Reserva confirmada con éxito!");
        reiniciar();
      }
    } catch (error) {
      console.error("Error al reservar:", error);
      alert("No se pudo guardar la reserva.");
    } finally {
      setCargando(false);
    }
  };

  // Función corregida para usar alSalir de App.jsx
  const manejarLogOut = async () => {
    if (window.confirm("¿Deseas cerrar tu sesión?")) {
      await alSalir();
    }
  };

  const irAlParqueadero = () => {
    const lat = 4.5932;
    const lng = -74.1248;
    // Este enlace funciona en Android (Google Maps) y iOS (Apple Maps/Google Maps)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  const obtenerHoraExpiracion = (fechaRegistro) => {
    if (!fechaRegistro) return "";

    // 1. Convertimos la fecha. Para evitar que JS la desplace,
    // reemplazamos el espacio por una 'T' si es necesario.
    const fecha = new Date(fechaRegistro.replace(" ", "T"));

    // 2. Sumamos las 2 horas de vigencia de la reserva
    fecha.setHours(fecha.getHours() + 2);

    // 3. Retornamos la hora en formato local de 12 horas (AM/PM)
    return fecha.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const cancelarReserva = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar esta reserva?"))
      return;
    try {
      const respuesta = await api.delete(`/reservas/${id}`);
      if (respuesta.data.success) {
        alert("Reserva cancelada");
        cargarHistorial();
      }
    } catch (error) {
      console.error("Error al cancelar:", error);
      alert("No se pudo cancelar la reserva.");
    }
  };

  return (
    <div className={styles.contenedor}>
      <nav className={styles.navbar}>
        <div
          className={styles.perfil}
          onClick={() => setPaso(3)}
          style={{ cursor: "pointer" }}
          title="Editar mi perfil"
        >
          <UserIcon size={20} />
          <span>{usuario.nombre}</span>
        </div>
        {/* Cambiamos el reload por manejarLogOut */}
        <button className={styles.btnLogOut} onClick={manejarLogOut}>
          <LogOut size={20} />
        </button>
      </nav>

      <main className={styles.mainContent}>
        <h1 className={styles.brandTitle}>SmartParkin</h1>

        {/* PASO 1: SELECCIÓN DE VEHÍCULO */}
        {paso === 1 && (
          <div className={styles.dropdownWrapper}>
            <button
              className={`${styles.selectorPrincipal} ${menuAbierto ? styles.activo : ""}`}
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              <span>{categoria ? categoria.nombre : "Tipo de Vehículo"}</span>
              <ChevronDown
                className={`${styles.chevron} ${menuAbierto ? styles.rotar : ""}`}
              />
            </button>

            {menuAbierto && (
              <div className={styles.listaOpciones}>
                {opciones.map((opt) => (
                  <button
                    key={opt.id}
                    className={styles.opcionItem}
                    onClick={() => {
                      setCategoria(opt);
                      setMenuAbierto(false);
                    }}
                  >
                    <div className={styles.iconContainer}>{opt.icono}</div>
                    <div className={styles.textoContainer}>
                      <span className={styles.optNombre}>{opt.nombre}</span>
                      <span className={styles.optDesc}>{opt.descripcion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {categoria && (
              <button
                className={styles.btnSiguiente}
                onClick={() => setPaso(2)}
              >
                Continuar con {categoria.nombre}
              </button>
            )}
          </div>
        )}
        {/* PASO 2: PLACA Y COLOR */}
        {paso === 2 && (
          <div className={styles.formularioPlaca}>
            <button className={styles.btnVolver} onClick={() => setPaso(1)}>
              <ArrowLeft size={18} /> Cambiar vehículo
            </button>

            <div className={styles.cajaInput}>
              <label>Número de Placa</label>
              <div className={styles.inputWrapper}>
                <Hash size={20} className={styles.iconInput} />
                <input
                  type="text"
                  placeholder="AAA000"
                  value={placa}
                  onChange={(e) => manejarCambio(e, setPlaca)}
                  maxLength={6}
                  className={styles.inputPlaca}
                />
              </div>
            </div>

            <div className={styles.cajaInput} style={{ marginTop: "1.5rem" }}>
              <label>Color del Vehículo</label>
              <div className={styles.inputWrapper}>
                <Palette size={20} className={styles.iconInput} />
                <input
                  type="text"
                  placeholder="EJ: BLANCO"
                  value={color}
                  onChange={(e) => manejarCambio(e, setColor)}
                  className={styles.inputColor}
                />
              </div>
            </div>

            <button
              className={styles.btnReservar}
              disabled={placa.length < 5 || color.length < 3 || cargando}
              onClick={confirmarReserva}
            >
              {cargando ? "Guardando..." : "Confirmar Reserva"}
            </button>
          </div>
        )}

        {/* PASO 3: MI PERFIL */}
        {paso === 3 && (
          <div className={styles.formularioPerfil}>
            <button className={styles.btnVolver} onClick={() => setPaso(1)}>
              <ArrowLeft size={18} /> Volver al Inicio
            </button>
            <h2 className={styles.tituloSeccion}>Mi Perfil</h2>

            <div className={styles.cajaInput}>
              <label>Correo Electrónico</label>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  value={nuevoCorreo}
                  onChange={(e) => setNuevoCorreo(e.target.value)}
                  className={styles.inputPerfil}
                />
              </div>
            </div>

            <div className={styles.cajaInput} style={{ marginTop: "1.5rem" }}>
              <label>Teléfono</label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="Tu número de teléfono"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  className={styles.inputPerfil}
                />
              </div>
            </div>

            <button
              className={styles.btnReservar}
              style={{ marginTop: "2rem" }}
              onClick={guardarCambiosPerfil}
            >
              {cargando ? "Guardando..." : "Guardar Cambios"}
            </button>

            <button
              className={styles.btnCerrarSesionPerfil}
              onClick={manejarLogOut}
            >
              Cerrar Sesión Permanente
            </button>
          </div>
        )}

        {/* HISTORIAL: Visible solo en los pasos de reserva */}
        {paso !== 3 && (
          <>
            <hr className={styles.separador} />

            {/* RESERVAS ACTIVAS */}
            <div className={styles.historialContainer}>
              <div className={styles.tituloHistorial}>
                <Activity size={20} />
                <h3>Reservas Activas</h3>
              </div>

              {misReservas.filter(
                (res) =>
                  res.estado === "En Sitio" || res.estado === "Pendiente",
              ).length > 0 ? (
                misReservas
                  .filter(
                    (res) =>
                      res.estado === "En Sitio" || res.estado === "Pendiente",
                  )
                  .map((res) => (
                    <div key={res.id_reserva} className={styles.tarjetaReserva}>
                      <div className={styles.reservaIcon}>
                        {res.tipo_vehiculo === "Liviano" ? (
                          <Car size={20} />
                        ) : res.tipo_vehiculo === "Moto" ? (
                          <Bike size={20} />
                        ) : (
                          <Truck size={20} />
                        )}
                      </div>
                      <div className={styles.reservaInfo}>
                        <span className={styles.reservaPlaca}>{res.placa}</span>
                        <span className={styles.reservaColor}>{res.color}</span>

                        {res.estado === "Pendiente" && (
                          <div className={styles.vigenciaBadge}>
                            <Clock size={12} />
                            <span>
                              Vence a las{" "}
                              {obtenerHoraExpiracion(res.fecha_registro)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={styles.accionesReserva}>
                        <span
                          className={`${styles.reservaEstado} ${styles[res.estado.toLowerCase().replace(" ", "")]}`}
                        >
                          {res.estado}
                        </span>
                        {res.estado === "Pendiente" && (
                          <button
                            className={styles.btnEliminar}
                            onClick={() => cancelarReserva(res.id_reserva)}
                            title="Cancelar reserva"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <p className={styles.sinReservas}>
                  No tienes reservas activas.
                </p>
              )}
            </div>

            <hr className={styles.separador} style={{ marginTop: "2rem" }} />

            {/* HISTORIAL */}
            <div className={styles.historialContainer}>
              <div
                className={styles.tituloHistorial}
                onClick={() => setHistorialVisible(!historialVisible)}
                style={{ cursor: "pointer" }}
              >
                <History size={20} />
                <h3>Historial</h3>
                <ChevronDown
                  className={`${styles.chevron} ${historialVisible ? styles.rotar : ""}`}
                  size={20}
                />
              </div>

              {historialVisible && (
                <>
                  {misReservas
                    .filter(
                      (res) =>
                        res.estado === "Finalizada" ||
                        res.estado === "Cancelada",
                    )
                    .sort(
                      (a, b) =>
                        new Date(b.fecha_registro) - new Date(a.fecha_registro),
                    )
                    .slice(0, registrosHistorial)
                    .map((res) => (
                      <div
                        key={res.id_reserva}
                        className={styles.tarjetaReserva}
                      >
                        <div className={styles.reservaIcon}>
                          {res.tipo_vehiculo === "Liviano" ? (
                            <Car size={20} />
                          ) : res.tipo_vehiculo === "Moto" ? (
                            <Bike size={20} />
                          ) : (
                            <Truck size={20} />
                          )}
                        </div>
                        <div className={styles.reservaInfo}>
                          <span className={styles.reservaPlaca}>
                            {res.placa}
                          </span>
                          <span className={styles.reservaColor}>
                            {res.color}
                          </span>

                          {res.estado === "Finalizada" && res.total_pagado && (
                            <div className={styles.montoPagado}>
                              Total pagado: $
                              {Number(res.total_pagado).toLocaleString("es-CO")}
                            </div>
                          )}
                        </div>
                        <div className={styles.accionesReserva}>
                          <span
                            className={`${styles.reservaEstado} ${styles[res.estado.toLowerCase()]}`}
                          >
                            {res.estado}
                          </span>
                        </div>
                      </div>
                    ))}

                  {misReservas.filter(
                    (res) =>
                      res.estado === "Finalizada" || res.estado === "Cancelada",
                  ).length > registrosHistorial && (
                    <button
                      className={styles.btnCargarMas}
                      onClick={() =>
                        setRegistrosHistorial(registrosHistorial + 10)
                      }
                    >
                      Cargar más
                    </button>
                  )}

                  {misReservas.filter(
                    (res) =>
                      res.estado === "Finalizada" || res.estado === "Cancelada",
                  ).length === 0 && (
                    <p className={styles.sinReservas}>No hay historial aún.</p>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </main>
      {/* Botón Flotante para Navegación */}
      <button
        className={styles.btnFlotanteMapa}
        onClick={irAlParqueadero}
        title="¿Cómo llegar?"
      >
        <MapPinned size={28} />
        <span className={styles.tooltipMapa}>Como llegar</span>
      </button>
    </div> // Este es el último div del contenedor principal
  );
}
