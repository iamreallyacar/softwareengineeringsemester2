import React from 'react';
// This imports dependencies for React and DOM rendering
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const root = createRoot(document.getElementById('root'));
// root.render(...) attaches the <App /> component to the page
root.render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);