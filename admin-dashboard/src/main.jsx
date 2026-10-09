import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import config from './lib/config';
import './index.css';

document.title = config.brandName;
document.documentElement.style.setProperty('--brand', config.primaryColor);
document.documentElement.style.setProperty('--accent', config.accentColor);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
