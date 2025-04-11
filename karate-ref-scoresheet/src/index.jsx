// src/index.js
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter basename="/KarateScorer/karate-ref-scoresheet">
    <App />
  </BrowserRouter>
);
