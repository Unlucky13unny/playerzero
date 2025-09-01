import { User } from "lucide-react"
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
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mr-1.5">
              <path d="M13 19H7M13 19V10.6C13 10.4409 12.9368 10.2883 12.8243 10.1758C12.7117 10.0632 12.5591 10 12.4 10H7.6C7.44087 10 7.28826 10.0632 7.17574 10.1758C7.06321 10.2883 7 10.4409 7 10.6V19M13 19H18.4C18.5591 19 18.7117 18.9368 18.8243 18.8243C18.9368 18.7118 19 18.5591 19 18.4V16.1C19 15.9409 18.9368 15.7883 18.8243 15.6758C18.7117 15.5632 18.5591 15.5 18.4 15.5H13.6C13.4409 15.5 13.2883 15.5632 13.1757 15.6758C13.0632 15.7883 13 15.9409 13 16.1V19ZM7 19V14.1C7 13.9409 6.93679 13.7883 6.82426 13.6758C6.71174 13.5632 6.55913 13.5 6.4 13.5H1.6C1.44087 13.5 1.28826 13.5632 1.17574 13.6758C1.06321 13.7883 1 13.9409 1 14.1V18.4C1 18.5591 1.06321 18.7118 1.17574 18.8243C1.28826 18.9368 1.44087 19 1.6 19H7ZM8.806 3.11302L9.715 1.18602C9.73954 1.13093 9.77952 1.08413 9.8301 1.05129C9.88068 1.01845 9.93969 1.00098 10 1.00098C10.0603 1.00098 10.1193 1.01845 10.1699 1.05129C10.2205 1.08413 10.2605 1.13093 10.285 1.18602L11.195 3.11302L13.227 3.42402C13.488 3.46402 13.592 3.80002 13.403 3.99202L11.933 5.49202L12.28 7.61002C12.324 7.88202 12.052 8.09002 11.818 7.96102L10 6.96102L8.182 7.96102C7.949 8.08902 7.676 7.88202 7.72 7.61002L8.067 5.49202L6.597 3.99202C6.407 3.80002 6.512 3.46402 6.772 3.42402L8.806 3.11302Z" stroke="#DC2627" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Leaderboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
