import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { FeatureFlagProvider } from './contexts/FeatureFlagContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import './App.css'
import AppRoutes from './AppRoutes'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <FeatureFlagProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </FeatureFlagProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
