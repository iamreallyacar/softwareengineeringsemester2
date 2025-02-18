import React from 'react';
import { createRoot } from 'react-dom/client';
import './importAllCSS';
//import './css/smart-home-page.css';
//import './css/App.css';
//import './css/styles.css';
import App from './App';

/**
 * Initializes the root of the React application.
 * 
 * This constant `root` is created by calling the `createRoot` function
 * from the ReactDOM library, which is used to manage the rendering of
 * the React component tree. The `createRoot` function takes a DOM element
 * with the id 'root' as its argument, which is typically the main container
 * element in the HTML file where the React application will be mounted
 * 
 * The root object that manages the rendering of the React component tree.
 */
const root = createRoot(document.getElementById('root'));
// root.render(...) attaches the <App /> component to the page
root.render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);