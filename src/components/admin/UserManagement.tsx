import { useState, useEffect } from 'react'
import { adminService, type AdminUserData, type AdminStats } from '../../services/adminService'

export const UserManagement = () => {
  const [users, setUsers] = useState<AdminUserData[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<AdminUserData[]>([])
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'paid' | 'trial' | 'free'>('all')

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, selectedFilter])

  const loadUserData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [usersResponse, statsResponse] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAdminStats()
      ])

      if (usersResponse.error) {
        setError('Failed to load users: ' + usersResponse.error.message)
      } else {
        setUsers(usersResponse.data || [])
      }

      if (statsResponse.error) {
        console.warn('Failed to load stats:', statsResponse.error)
      } else {
        setStats(statsResponse.data)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error loading user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user => 
        user.trainer_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    switch (selectedFilter) {
      case 'paid':
        filtered = filtered.filter(user => user.is_paid_user)
        break
      case 'trial':
        filtered = filtered.filter(user => user.trial_active)
        break
      case 'free':
        filtered = filtered.filter(user => !user.is_paid_user && !user.trial_active)
        break
      default:
        // 'all' - no additional filtering
        break
    }

    setFilteredUsers(filtered)
  }



  const getStatusBadge = (user: AdminUserData) => {
    if (user.is_paid_user) {
      return <span className="status-badge paid">Premium</span>
    } else if (user.trial_active) {
      return <span className="status-badge trial">Trial Active</span>
    } else {
      return <span className="status-badge free">Free</span>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="admin-user-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-user-management">
      {/* Header and Stats */}
      <div className="user-management-header">
        <div className="header-info">
          <h2>User Management</h2>
          <p>Manage all registered users, their subscriptions, and trial status</p>
        </div>
        
        {stats && (
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.total_users}</span>
              <span className="stat-label">Total Users</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.paid_users}</span>
              <span className="stat-label">Premium</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.trial_users}</span>
              <span className="stat-label">On Trial</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="user-management-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by trainer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>

        <div className="filter-tabs">
          {[
            { key: 'all', label: 'All Users', count: users.length },
            { key: 'paid', label: 'Premium', count: users.filter(u => u.is_paid_user).length },
            { key: 'trial', label: 'Trial', count: users.filter(u => u.trial_active).length },
            { key: 'free', label: 'Free', count: users.filter(u => !u.is_paid_user && !u.trial_active).length }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key as any)}
              className={`filter-tab ${selectedFilter === filter.key ? 'active' : ''}`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={() => setError(null)} className="error-dismiss">×</button>
        </div>
      )}

      {/* Users Table */}
      <div className="users-table-container">
        <div className="users-table">
          <div className="table-header">
            <div className="header-cell trainer-col">Trainer</div>
            <div className="header-cell email-col">Email</div>
            <div className="header-cell status-col">Status</div>
            <div className="header-cell date-col">Joined</div>
          </div>

          <div className="table-body">
            {filteredUsers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No users found</h3>
                <p>
                  {searchQuery 
                    ? `No users match "${searchQuery}"`
                    : selectedFilter === 'all' 
                      ? 'No users registered yet'
                      : `No ${selectedFilter} users found`
                  }
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="table-row">
                  <div className="table-cell trainer-col">
                    <div className="trainer-info">
                      <div className="trainer-avatar">
                        {user.trainer_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="trainer-details">
                        <div className="trainer-name">{user.trainer_name}</div>
                        <div className="profile-status">
                          {user.profile_complete ? (
                            <span className="profile-complete">✓ Complete</span>
                          ) : (
                            <span className="profile-incomplete">⚠ Incomplete</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="table-cell email-col">
                    <div className="email-info">
                      {user.email}
                      {user.last_sign_in_at && (
                        <div className="last-signin">
                          Last active: {formatDate(user.last_sign_in_at)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="table-cell status-col">
                    <div className="status-info">
                      {getStatusBadge(user)}
                      {user.trial_active && user.trial_expires_at && (
                        <div className="trial-expiry">
                          Expires: {formatDate(user.trial_expires_at)}
                        </div>
                      )}
                      {user.is_paid_user && user.subscription_expires_at && (
                        <div className="subscription-expiry">
                          Renews: {formatDate(user.subscription_expires_at)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="table-cell date-col">
                    {formatDate(user.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {filteredUsers.length > 0 && (
        <div className="results-summary">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      )}
    </div>
  )
} 