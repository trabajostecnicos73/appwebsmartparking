const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// --- CONFIGURACIÓN DE MIDDLEWARES ---
app.use(cors()); // Permite conexiones desde tu app de React
app.use(express.json()); // ¡IMPORTANTE! Permite leer el cuerpo (body) de las peticiones POST

// --- CONFIGURACIÓN DE LA BASE DE DATOS ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Tu usuario de MySQL
    password: 'PasswordMySQL',      // Tu contraseña de MySQL
    database: 'parqueadero_web' 
});

db.query("SET time_zone = '-05:00';", (err) => {
    if(err) console.log("Error configurando zona horaria:", err);
    else console.log("Zona horaria ajustada a Colombia (-05:00)");
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// --- RUTA DE LOGIN PARA EL CONSUMIDOR ---
app.post('/api/auth/login', (req, res) => {
    const { correo, password } = req.body;

    // AGREGAMOS 'telefono' a la consulta para que React lo reciba
    const query = 'SELECT id_usuario, nombre, correo, telefono FROM usuarios WHERE correo = ? AND password = ?';
    
    db.query(query, [correo, password], (err, results) => {
        if (err) {
            console.error("Error en login:", err);
            return res.status(500).json({ success: false, mensaje: "Error en el servidor" });
        }

        if (results.length > 0) {
            // Ahora 'results[0]' incluirá el teléfono: { id_usuario: 1, nombre: '...', correo: '...', telefono: '...' }
            res.json({
                success: true,
                usuario: results[0] 
            });
        } else {
            res.status(401).json({
                success: false,
                mensaje: "Correo o contraseña incorrectos"
            });
        }
    });
});

// --- NUEVA RUTA: CREAR RESERVA ---
// Esta ruta recibe los datos desde el paso 2 de tu Home.jsx
app.post('/api/reservas', (req, res) => {
    const { id_usuario, tipo_vehiculo, placa, color } = req.body;

    if (!id_usuario || !tipo_vehiculo || !placa) {
        return res.status(400).json({ success: false, mensaje: "Faltan datos obligatorios" });
    }

    const sql = `INSERT INTO reservas (id_usuario, tipo_vehiculo, placa, color, fecha_registro, fecha_expiracion, estado) 
                 VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'Pendiente')`;
    
    db.query(sql, [id_usuario, tipo_vehiculo, placa, color], (err, result) => {
        if (err) {
            console.error("Error al insertar reserva:", err);
            return res.status(500).json({ success: false, mensaje: "Error al guardar la reserva" });
        }
        res.json({ success: true, mensaje: "Reserva creada exitosamente", id_reserva: result.insertId });
    });
});

// --- RUTA DE VERIFICACIÓN (OPCIONAL) ---
app.get('/', (req, res) => {
    res.send('Servidor SmartParkin activo y listo.');
});

// Obtener las reservas de un usuario específico
app.get('/api/reservas/:id_usuario', (req, res) => {
    const { id_usuario } = req.params;
    const query = 'SELECT * FROM reservas WHERE id_usuario = ? ORDER BY fecha_registro DESC LIMIT 5';
    
    db.query(query, [id_usuario], (err, results) => {
        if (err) {
            console.error("Error al obtener reservas:", err);
            return res.status(500).json({ success: false, mensaje: "Error al obtener historial" });
        }
        res.json({ success: true, reservas: results });
    });
});

// FUNCIÓN PARA LIMPIAR RESERVAS EXPIRADAS (Cada 5 minutos)
const limpiarReservasExpiradas = () => {
    // Esta consulta busca reservas 'Pendientes' con más de 2 horas de antigüedad
    const query = `
        DELETE FROM reservas 
        WHERE estado = 'Pendiente' 
        AND fecha_registro < DATE_SUB(NOW(), INTERVAL 2 HOUR)
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error("Error al limpiar reservas expiradas:", err);
            return;
        }
        if (result.affectedRows > 0) {
            console.log(`[LIMPIEZA] Se eliminaron ${result.affectedRows} reservas expiradas.`);
        }
    });
};

// Ruta para cancelar (eliminar) una reserva
app.delete('/api/reservas/:id_reserva', (req, res) => {
    const { id_reserva } = req.params;
    const query = 'DELETE FROM reservas WHERE id_reserva = ? AND estado = "Pendiente"';

    db.query(query, [id_reserva], (err, result) => {
        if (err) {
            console.error("Error al cancelar reserva:", err);
            return res.status(500).json({ success: false, mensaje: "Error en el servidor" });
        }
        if (result.affectedRows > 0) {
            res.json({ success: true, mensaje: "Reserva cancelada correctamente" });
        } else {
            res.status(404).json({ success: false, mensaje: "No se encontró la reserva o ya no es cancelable" });
        }
    });
});

// Ruta para actualizar datos del perfil
app.put('/api/usuarios/actualizar', (req, res) => {
    const { id_usuario, correo, telefono } = req.body;

    const query = 'UPDATE usuarios SET correo = ?, telefono = ? WHERE id_usuario = ?';
    
    db.query(query, [correo, telefono, id_usuario], (err, result) => {
        if (err) {
            console.error("Error al actualizar perfil:", err);
            return res.status(500).json({ success: false, mensaje: "Error al actualizar" });
        }
        res.json({ success: true, mensaje: "Datos actualizados con éxito" });
    });
});

// Ruta para registrar nuevos usuarios
app.post('/api/auth/registro', (req, res) => {
    const { nombre, correo, password, telefono } = req.body;

    // 1. Verificar si el correo ya está registrado
    const existeQuery = 'SELECT id_usuario FROM usuarios WHERE correo = ?';
    
    db.query(existeQuery, [correo], (err, results) => {
        if (err) return res.status(500).json({ success: false, mensaje: "Error al verificar usuario" });
        if (results.length > 0) {
            return res.status(400).json({ success: false, mensaje: "Este correo ya está registrado" });
        }

        // 2. Insertar el nuevo usuario
        const insertQuery = 'INSERT INTO usuarios (nombre, correo, password, telefono) VALUES (?, ?, ?, ?)';
        db.query(insertQuery, [nombre, correo, password, telefono], (err, result) => {
            if (err) return res.status(500).json({ success: false, mensaje: "Error al crear la cuenta" });
            
            // Devolvemos el usuario creado para que haga login automático
            res.json({ 
                success: true, 
                usuario: { id_usuario: result.insertId, nombre, correo, telefono } 
            });
        });
    });
});

// Ruta para recuperar contraseña 
app.put('/api/auth/recuperar-password', (req, res) => {
    // CAMBIO: Usamos 'password' en lugar de 'nuevaPassword' para coincidir con el Login.jsx
    const { correo, telefono, password } = req.body;

    if (!correo || !telefono || !password) {
        return res.status(400).json({ success: false, mensaje: "Faltan datos requeridos" });
    }

    const sql = "UPDATE usuarios SET password = ? WHERE correo = ? AND telefono = ?";
    
    db.query(sql, [password, correo, telefono], (err, result) => {
        if (err) {
            console.error("Error en MySQL:", err);
            return res.status(500).json({ success: false, mensaje: "Error en el servidor" });
        }

        if (result.affectedRows > 0) {
            res.json({ success: true, mensaje: "Contraseña actualizada correctamente" });
        } else {
            // Si llega aquí es porque el correo o el teléfono no existen o no coinciden
            res.status(404).json({ success: false, mensaje: "Los datos de validación son incorrectos" });
        }
    });
});

// Ejecutar la limpieza automáticamente cada 5 minutos
setInterval(limpiarReservasExpiradas, 5 * 60 * 1000);

// --- ARRANCAR EL SERVIDOR ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor de SmartParkin corriendo en http://localhost:${PORT}`);
});