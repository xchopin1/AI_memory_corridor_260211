import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { AIConfigProvider } from './contexts/AIConfigContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <AIConfigProvider>
        <App />
      </AIConfigProvider>
    </AuthProvider>
  </React.StrictMode>
);
