import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { VDBUploadContextProvider } from './utils/VDBUpload';

ReactDOM.createRoot(document.getElementById('root')).render(
  <VDBUploadContextProvider>
    <App />
  </VDBUploadContextProvider>
);
