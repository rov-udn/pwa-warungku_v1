import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🎯 IMPOR GUDANG PUSAT CONTEXT PWA WARUNG
import { AppProvider } from './context/AppContext.jsx'

createRoot(document.getElementById('root')).render(
  // 🎯 STRICTMODE DIHAPUS BIAR TIDAK DOUBLE RENDER PAS DEVELOPMENT
  <AppProvider>
    <App />
  </AppProvider>
)

// Service Worker PWA tetap aman di paling bawah
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('🚀 Warungku PWA Service Worker terdaftar!', reg.scope))
      .catch((err) => console.error('❌ Gagal daftar Service Worker:', err));
  });
}