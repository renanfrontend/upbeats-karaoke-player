
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n' // Import i18n configuration before rendering

// Get the root element to render our app
const container = document.getElementById("root");
if (!container) throw new Error("Failed to find the root element");

// Create root and render the app
createRoot(container).render(<App />);
