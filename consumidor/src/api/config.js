import axios from 'axios';

// INSTRUCCIONES:
// 1. Para desarrollo en el navegador (PC): usa 'http://localhost:3000/api'
// 2. Para probar en el celular: reemplaza 'localhost' con la IP de tu PC
//    Ejemplo: 'http://192.168.1.25:3000/api'
// 
// Para encontrar tu IP:
// - Windows: abre CMD y escribe 'ipconfig' (busca IPv4)
// - Mac/Linux: abre Terminal y escribe 'ifconfig' o 'ip addr'

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // <-- CAMBIA localhost por tu IP si usas celular
});

export default api;