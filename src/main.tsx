import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 初始化主题
const savedTheme = localStorage.getItem('md-editor-theme') || 'dark';
document.documentElement.className = savedTheme;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
