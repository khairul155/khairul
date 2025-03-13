
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initPageLoader } from './utils/pageLoader.ts'

// Initialize page loader to prevent FOUC
document.addEventListener('DOMContentLoaded', initPageLoader);

createRoot(document.getElementById("root")!).render(<App />);
