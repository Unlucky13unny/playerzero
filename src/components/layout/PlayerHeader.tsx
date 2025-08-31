import { Menu, User, Trophy } from "lucide-react"
import { Button } from "../ui/button"
import { Crown } from "../icons/Crown"
import { Link, useNavigate } from "react-router-dom"
import { useMobile } from "../../hooks/useMobile"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { NotificationBell } from "../common/NotificationBell"

interface PlayerHeaderProps {
  viewMode: "public" | "private" | "team" | "own"
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
        <Link to="/UserProfile" className="text-xl font-bold text-black hover:text-gray-700 transition-colors">
          Player<span className="font-normal">ZER⊘</span>
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
                  <Trophy className="w-4 h-4 mr-1" />
                  Leaderboard
                </Button>
              </Link>
            )}
          </>
        )}

        {/* Trial Badge for non-mobile */}
        {userType === "trial" && !isMobile && (
          <button 
            onClick={handleUpgrade}
            className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
            title="Upgrade to Premium"
          >
            <Crown className="w-4 h-4 text-white" />
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
            <Menu className="w-5 h-5 text-gray-600" />
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
