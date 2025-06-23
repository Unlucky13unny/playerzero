import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LoginForm } from './components/auth/LoginForm'
import { SignupForm } from './components/auth/SignupForm'
import { ForgotPassword } from './components/auth/ForgotPassword'
import { ResetPassword } from './components/auth/ResetPassword'
import { SignupSuccess } from './components/auth/SignupSuccess'
import { UserProfile } from './components/user/UserProfile'
import { ProfileSetup } from './components/user/ProfileSetup'
import { PostProfileTutorial } from './components/user/PostProfileTutorial'
import { Dashboard } from './components/dashboard/Dashboard'
import { UpgradePage } from './components/upgrade/UpgradePage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ProfileGuard } from './components/auth/ProfileGuard'
import { Layout } from './components/layout/Layout'
import { PublicProfile } from './components/profile/PublicProfile'
import { AdminLogin } from './components/auth/AdminLogin'
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboard } from './components/admin/AdminDashboard'

// Import CSS
import './index.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup-success" element={<SignupSuccess />} />
          
          {/* Profile setup route - protected with layout */}
          <Route path="/profile-setup" element={
            <Layout>
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            </Layout>
          } />
          
          {/* Tutorial route - after profile setup */}
          <Route path="/tutorial" element={
            <Layout>
              <ProtectedRoute>
                <PostProfileTutorial />
              </ProtectedRoute>
            </Layout>
          } />
          
          {/* Protected routes with profile guard */}
          <Route path="/" element={
            <Layout>
              <ProtectedRoute>
                <ProfileGuard>
                  <Dashboard />
                </ProfileGuard>
              </ProtectedRoute>
            </Layout>
          } />
          
          <Route path="/profile" element={
            <Layout>
              <ProtectedRoute>
                <ProfileGuard>
                  <UserProfile />
                </ProfileGuard>
              </ProtectedRoute>
            </Layout>
          } />
          
          <Route path="/upgrade" element={
            <Layout>
              <ProtectedRoute>
                <ProfileGuard>
                  <UpgradePage />
                </ProfileGuard>
              </ProtectedRoute>
            </Layout>
          } />
          
          {/* Public Profile Route - No ProfileGuard needed */}
          <Route 
            path="/profile/:profileId" 
            element={
              <Layout>
                <ProtectedRoute>
                  <PublicProfile />
                </ProtectedRoute>
              </Layout>
            } 
          />
          
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route path="/admin/dashboard" element={
            <AdminLayout>
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            </AdminLayout>
          } />
          
          <Route path="/admin/users" element={
            <AdminLayout>
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            </AdminLayout>
          } />
          
          <Route path="/admin/analytics" element={
            <AdminLayout>
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            </AdminLayout>
          } />
          
          <Route path="/admin/*" element={
            <AdminLayout>
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            </AdminLayout>
          } />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
