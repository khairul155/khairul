
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CreditsProvider } from './components/CreditsProvider.tsx';
import { Toaster } from './components/ui/toaster.tsx';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);
