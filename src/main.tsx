import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// register service worker (if supported)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(err => {
      console.warn('SW registration failed', err)
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
