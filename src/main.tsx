import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './registerServiceWorker';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/** Hand the screen over from the HTML boot splash to React. */
const boot = document.getElementById('peyk-boot');
if (boot) {
  boot.dataset.leaving = 'true';
  window.setTimeout(() => boot.remove(), 300);
}

registerServiceWorker();
