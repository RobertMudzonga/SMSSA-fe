
import { createRoot } from 'react-dom/client'
import './lib/api'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext';
import './index.css'

// Remove dark mode class addition
createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
