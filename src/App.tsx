import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import './App.css'
import AppRoutes from './AppRoutes'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
