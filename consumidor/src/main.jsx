import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // Cambiamos Home por App
import './index.css'

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => console.log('Service Worker registrado'))
      .catch((err) => console.log('Error Service Worker:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)