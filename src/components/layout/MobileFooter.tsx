import { User, Trophy } from "lucide-react"
import { Button } from "../ui/button"
import { Link } from "react-router-dom"
import { useMobile } from "../../hooks/useMobile"

interface MobileFooterProps {
  currentPage?: "profile" | "leaderboard"
}

export function MobileFooter({ currentPage = "profile" }: MobileFooterProps) {
  const isMobile = useMobile()
  
  // Hide footer in web view
  if (!isMobile) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
      <div className="flex gap-4 justify-center max-w-md mx-auto">
        <Link to="/UserProfile" className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className={`w-full h-10 text-xs font-medium ${
              currentPage === "profile"
                ? "text-red-500 border-red-500 hover:bg-red-50 bg-white"
                : "text-gray-700 border-gray-300 hover:bg-gray-50 bg-white"
            }`}
          >
            <User className="w-3.5 h-3.5 mr-1.5" />
            Profile
          </Button>
        </Link>
        <Link to="/leaderboards" className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className={`w-full h-10 text-xs font-medium ${
              currentPage === "leaderboard"
                ? "text-red-500 border-red-500 hover:bg-red-50 bg-white"
                : "text-gray-700 border-gray-300 hover:bg-gray-50 bg-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 mr-1.5" />
            Leaderboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
