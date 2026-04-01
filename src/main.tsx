// Import StrictMode from React for highlighting potential problems in an application
import {StrictMode} from 'react';
// Import createRoot from react-dom/client to create a root for rendering React components
import {createRoot} from 'react-dom/client';
// Import the main App component from App
import App from './App';
// Import the global CSS file for styling the application
import './index.css';

// Create a root element by targeting the 'root' div in index.html and render the App component
createRoot(document.getElementById('root')!).render(
  // Wrap the App in StrictMode for additional development checks
  <StrictMode>
    {/* Render the main App component */}
    <App />
  </StrictMode>,
);
