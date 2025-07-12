import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { UserManagement } from './UserManagement'
import { StatEntries } from './StatEntries'
import { ScreenshotModeration } from './ScreenshotModeration'

export const AdminDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('users')

  const tabs = [
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'content', label: 'Stat Entries', icon: '📝' },
    { id: 'screenshots', label: 'Screenshot Moderation', icon: '📸' }
  ]



  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user?.email}. Here's what's happening with PlayerZERO today.</p>
      </div>

      <div className="dashboard-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span style={{ marginRight: '0.5rem' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeTab === 'users' && (
          <UserManagement />
        )}

        {activeTab === 'content' && (
          <StatEntries />
        )}

        {activeTab === 'screenshots' && (
          <ScreenshotModeration />
        )}
      </div>
    </div>
  )
} 