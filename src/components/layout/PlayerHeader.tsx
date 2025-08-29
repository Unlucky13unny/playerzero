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
                  className="text-red-500 border-red-500 hover:bg-red-50 bg-transparent"
                >
                  <User className="w-4 h-4 mr-1" />
                  Profile
                </Button>
              </Link>
            )}
            {showLeaderboardButton && (
              <Link to="/leaderboards">
                <Button variant="outline" size="sm" className="text-black border-black hover:bg-gray-50">
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
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="text-sm font-medium text-gray-900">{user?.email}</div>
                <div className="text-xs text-gray-500">
                  {userType === "trial" ? "Trial Account" : "Premium Account"}
                </div>
              </div>
              
              <Link
                to="/profile?edit=true"
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="w-4 h-4 mr-3" />
                Edit Profile
              </Link>
              
              <Link
                to="/update-stats"
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                📊 Update Stats
              </Link>
              
              <Link
                to="/calculators"
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                🧮 Calculators
              </Link>
              
              <Link
                to="/search"
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                🔍 Search Users
              </Link>
              
              <Link
                to="/contact"
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                💬 Help & Support
              </Link>

              {userType === "trial" && (
                <button
                  onClick={handleUpgrade}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Crown className="w-4 h-4 mr-3" />
                  Upgrade to Premium
                </button>
              )}
              
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
