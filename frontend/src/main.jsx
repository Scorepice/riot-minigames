import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StreamerProvider } from './context/StreamerContext'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StreamerProvider>
        <App />
      </StreamerProvider>
    </BrowserRouter>
  </React.StrictMode>
)
