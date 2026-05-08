import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/card.css'
import './styles/styles.css'
import './styles/chat.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
