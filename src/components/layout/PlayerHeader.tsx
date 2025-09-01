import { User } from "lucide-react"
import { Button } from "../ui/button"
import { Crown } from "../icons/Crown"
import { Link, useNavigate } from "react-router-dom"
import { useMobile } from "../../hooks/useMobile"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { NotificationBell } from "../common/NotificationBell"
import logoSvg from "/images/logo.svg"

interface PlayerHeaderProps {
  userType: "trial" | "upgraded"
  showProfileButton?: boolean
  showLeaderboardButton?: boolean
}

export function PlayerHeader({
  userType,
  showProfileButton = false,
  showLeaderboardButton = false,
}: PlayerHeaderProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById('player-header-menu')
      if (menu && !menu.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
      setMenuOpen(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleUpgrade = () => {
    navigate('/upgrade')
    setMenuOpen(false)
  }

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="flex items-center">
        <Link to="/UserProfile" className="flex items-center hover:opacity-80 transition-opacity">
          <img 
            src={logoSvg} 
            alt="PlayerZero" 
            className="h-8 w-auto"
          />
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {!isMobile && (showProfileButton || showLeaderboardButton) && (
          <>
            {showProfileButton && (
              <Link to="/UserProfile">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-500 hover:bg-red-50 bg-transparent w-32"
                >
                  <User className="w-4 h-4 mr-1" />
                  Profile
                </Button>
              </Link>
            )}
            {showLeaderboardButton && (
              <Link to="/leaderboards">
                <Button variant="outline" size="sm" className="text-black border-black hover:bg-gray-50 w-32">
                  <div style={{
                    position: 'relative',
                    width: '24px',
                    height: '24px',
                    marginRight: '4px'
                  }}>
                    <img 
                      src="/images/leaderboard.svg" 
                      alt="Leaderboard" 
                      style={{
                        /* Vector */
                        position: 'absolute',
                        left: '12.5%',
                        right: '12.5%',
                        top: '12.5%',
                        bottom: '12.5%'
                      }}
                    />
                  </div>
                  Leaderboard
                </Button>
              </Link>
            )}
          </>
        )}

        {/* Trial Badge for desktop */}
        {userType === "trial" && !isMobile && (
          <button 
            onClick={handleUpgrade}
            className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
            title="Upgrade to Premium"
          >
            <Crown className="w-4 h-4 text-white" />
          </button>
        )}

        {/* Trial Badge for mobile */}
        {userType === "trial" && isMobile && (
          <button 
            onClick={handleUpgrade}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Upgrade to Premium"
          >
            <svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect y="0.5" width="30" height="30" rx="15" fill="#DC2627"/>
              <path d="M7.81576 23.3288V21.3112H22.1842V23.3288H7.81576ZM7.81576 19.7981L6.50721 11.7027C6.473 11.7027 6.43434 11.7071 6.39124 11.7158C6.34813 11.7246 6.30982 11.7286 6.27629 11.7279C5.84866 11.7279 5.48534 11.5806 5.18634 11.2861C4.88734 10.9915 4.7375 10.6344 4.73682 10.2148C4.73613 9.79511 4.88598 9.43801 5.18634 9.14344C5.48671 8.84888 5.85003 8.7016 6.27629 8.7016C6.70255 8.7016 7.06621 8.84888 7.36726 9.14344C7.66832 9.43801 7.81782 9.79511 7.81576 10.2148C7.81576 10.3324 7.80276 10.4417 7.77676 10.5426C7.75076 10.6435 7.721 10.736 7.68748 10.82L10.8947 12.2323L14.1019 7.9198C13.9138 7.7853 13.7598 7.60877 13.6401 7.3902C13.5204 7.17163 13.4605 6.93625 13.4605 6.68406C13.4605 6.26374 13.6103 5.9063 13.91 5.61173C14.2097 5.31717 14.573 5.17023 15 5.1709C15.4269 5.17157 15.7906 5.31885 16.0909 5.61274C16.3913 5.90663 16.5408 6.26374 16.5394 6.68406C16.5394 6.93625 16.4796 7.17163 16.3598 7.3902C16.2401 7.60877 16.0862 7.7853 15.898 7.9198L19.1052 12.2323L22.3125 10.82C22.2783 10.736 22.2482 10.6435 22.2222 10.5426C22.1962 10.4417 22.1835 10.3324 22.1842 10.2148C22.1842 9.79444 22.334 9.437 22.6337 9.14244C22.9334 8.84787 23.2967 8.70093 23.7236 8.7016C24.1506 8.70227 24.5143 8.84956 24.8146 9.14344C25.115 9.43733 25.2645 9.79444 25.2631 10.2148C25.2618 10.6351 25.1123 10.9925 24.8146 11.2871C24.517 11.5816 24.1533 11.7286 23.7236 11.7279C23.6894 11.7279 23.6511 11.7239 23.6087 11.7158C23.5663 11.7077 23.5276 11.7034 23.4927 11.7027L22.1842 19.7981H7.81576ZM9.5605 17.7805H20.4394L21.1065 13.5689L18.4125 14.729L15 10.1139L11.5875 14.729L8.8934 13.5689L9.5605 17.7805Z" fill="#EFEFEF"/>
            </svg>
          </button>
        )}

        {/* Notifications */}
        {user && <NotificationBell />}

        {/* Menu Dropdown */}
        <div className="relative" id="player-header-menu">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title="Menu"
          >
            <img src="/images/threelinea.svg" alt="Menu" className="w-12 h-12" />
          </button>

          {menuOpen && (
            <div className="layout-menu-dropdown" style={{ width: '177px', height: '239px' }}>
              {/* Profile Settings */}
              <Link
                to="/profile?edit=true"
                onClick={() => setMenuOpen(false)}
                className="layout-menu-item"
                style={{ width: '157px', height: '36px', padding: '0px 8px' }}
              >
                Profile Settings
              </Link>

              {/* Color options */}
              <Link
                to="/calculators"
                onClick={() => setMenuOpen(false)}
                className="layout-menu-item"
                style={{ width: '157px', height: '36px', padding: '0px 8px' }}
              >
                Calculators
              </Link>

              {/* Search Users */}
              <Link
                to="/search"
                onClick={() => setMenuOpen(false)}
                className="layout-menu-item"
                style={{ width: '157px', height: '36px', padding: '0px 8px' }}
              >
                Search Users
              </Link>

              {/* Help & Support */}
              <Link
                to="/contact"
                onClick={() => setMenuOpen(false)}
                className="layout-menu-item"
                style={{ width: '157px', height: '36px', padding: '0px 8px' }}
              >
                Help & Support
              </Link>

              {/* Logout */}
              <button
                onClick={handleSignOut}
                className="layout-menu-item"
                style={{ width: '157px', height: '36px', padding: '0px 8px' }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
