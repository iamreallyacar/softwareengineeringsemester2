import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css'; // Corrected the import statement
import Game from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>
);