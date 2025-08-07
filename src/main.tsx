import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/main.css'
import App from './App.tsx'
import { validateEnvironmentVariables, logEnvironmentInfo } from './utils/envValidation'
import { validateVercelEnvironment, logVercelInfo } from './utils/vercelUtils'

// Validate environment variables
if (import.meta.env.DEV) {
  validateEnvironmentVariables()
  logEnvironmentInfo()
}

// Validate Vercel environment in production
if (import.meta.env.PROD) {
  validateVercelEnvironment()
  logVercelInfo()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
