import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '../css/index.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { getTokenFromUrl, saveAccessToken, removeAccessTokenFromURL } from './utils/tokens';

const token = getTokenFromUrl();
if (token) {
  saveAccessToken(token);
  removeAccessTokenFromURL();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
