import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
} catch (error: any) {
  rootElement.innerHTML = `
    <div style="padding: 20px; color: white; background: #1a1a1a; font-family: sans-serif;">
      <h1 style="color: #ff4d4d;">Startup Error</h1>
      <pre style="background: #000; padding: 15px; border-radius: 5px; overflow: auto;">${error?.message || error}</pre>
      <p>Check the browser console for more details.</p>
    </div>
  `;
}
