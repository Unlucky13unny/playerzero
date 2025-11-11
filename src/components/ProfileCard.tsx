import { Crown } from "lucide-react";
import { CountryFlag } from "./common/CountryFlag";

// Utility function to generate social media links
const getSocialLink = (platform: string, value: string): string | undefined => {
  if (!value) return undefined
  
  // Special handling for Bluesky URLs - ensure .bsky.social is appended
  if (platform === 'bluesky') {
    // If it's already a full bsky.app URL
    if (value.startsWith('https://bsky.app/profile/') || value.startsWith('http://bsky.app/profile/')) {
      const urlParts = value.split('/profile/')
      if (urlParts.length === 2) {
        const username = urlParts[1].replace('@', '')
        const handle = username.includes('.') ? username : `${username}.bsky.social`
        return `https://bsky.app/profile/${handle}`
      }
    }
    // If it's just a username
    const username = value.replace('@', '')
    const handle = username.includes('.') ? username : `${username}.bsky.social`
    return `https://bsky.app/profile/${handle}`
  }
  
  // If value is already a full URL, return it as is (for other platforms)
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }
  
  switch (platform) {
    case 'x':
      return `https://x.com/${value.replace('@', '')}`
    case 'facebook':
      return `https://www.facebook.com/${value.replace('@', '')}`
    case 'discord':
      // Discord handles should have @ prefix
      return value.startsWith('@') ? value : `@${value}`
    case 'instagram':
      return `https://www.instagram.com/${value.replace('@', '')}`
    case 'youtube':
      return `https://www.youtube.com/@${value.replace('@', '')}`
    case 'tiktok':
      return `https://www.tiktok.com/@${value.replace('@', '')}`
    case 'twitch':
      return `https://www.twitch.tv/${value.replace('@', '')}`
    case 'reddit':
      return `https://www.reddit.com/user/${value.replace('@', '')}`
    default:
      return value
  }
}

interface ProfileCardProps {
  stats: any;
  user: any;
  teamInfo: any;
  getTeamColor: (teamName: string) => string;
  getTrainerCode: () => string;
  viewMode: string;
  userType: string;
  getModeButton?: () => React.ReactNode;
}

export default function ProfileCard({
  stats,
  user,
  teamInfo,
  getTeamColor,
  getTrainerCode,
  viewMode,
  userType,
  getModeButton,
}: ProfileCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full">
      {/* Top Section: Level, Name, Country, Socials */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Level */}
          <div className="text-center">
            <div className="text-4xl font-bold">{stats?.trainer_level || 1}</div>
            <div className="text-sm text-gray-600">L V L</div>
          </div>

          {/* User Info */}
          <div>
            {/* Username */}
            <h2 className="text-xl font-bold">
              {user?.email?.split("@")[0] || "Trainer"}
            </h2>

            {/* Country */}
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
              {stats?.country && (
                <>
                  <CountryFlag countryName={stats.country} size={24} />
                  <span>{stats.country}</span>
                </>
              )}
            </div>

            {/* Social Icons */}
            <div className="flex gap-2 mt-2">
              {/* Facebook Icon - Only show if linked */}
              {stats?.facebook && (
                <a 
                  href={getSocialLink('facebook', stats.facebook)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title={`Visit ${stats.facebook} on Facebook`}
                >
                  <img src="/images/facebook.svg" alt="Facebook" className="w-5 h-5 cursor-pointer" />
                </a>
              )}
              
              {/* Instagram Icon - Only show if linked */}
              {stats?.instagram && (
                <a 
                  href={getSocialLink('instagram', stats.instagram)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title={`Visit ${stats.instagram} on Instagram`}
                >
                  <img src="/images/instagram.svg" alt="Instagram" className="w-5 h-5 cursor-pointer" />
                </a>
              )}
              
              {/* Snapchat Icon - Only show if linked */}
              {stats?.snapchat && (
                <a 
                  href={getSocialLink('snapchat', stats.snapchat)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title={`Add ${stats.snapchat} on Snapchat`}
                >
                  <img src="/images/snapchat.svg" alt="Snapchat" className="w-5 h-5 cursor-pointer" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Upgrade Button */}
        {viewMode === "own" && userType === "trial" && (
          <button className="bg-red-500 hover:bg-red-600 text-white md:hidden px-4 rounded-md flex items-center h-12">
            <Crown className="w-4 h-4 mr-1" />
            Upgrade
          </button>
        )}
      </div>

      {/* Mode Buttons (Your existing logic) */}
      {getModeButton && getModeButton()}

      {/* Details Section */}
      <div className="mt-4 space-y-3 text-sm">
        {/* Team */}
        <div className="flex justify-between">
          <span className="text-gray-600">Team:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: getTeamColor(teamInfo?.name),
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}></div>
            <span className="font-medium" style={{ color: 'black' }}>
              {teamInfo?.name || "N/A"} Team
            </span>
          </div>
        </div>

        {/* Start Date */}
        <div className="flex justify-between">
          <span className="text-gray-600">Start Date:</span>
          <span>
            {stats?.start_date
              ? new Date(stats.start_date + 'T00:00:00').toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })
              : "N/A"}
          </span>
        </div>

        {/* Summit Date */}
        <div className="flex justify-between">
          <span className="text-gray-600">80 Summit</span>
          <span>
            {(stats?.trainer_level || 0) >= 80 ? "Complete" : "In Progress"}
          </span>
        </div>

        {/* Trainer Code */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Trainer Code:</span>
          <div className="flex items-center gap-2">
            <span>{getTrainerCode ? getTrainerCode() : "N/A"}</span>
            {viewMode !== "private" || userType === "upgraded" ? (
              <button className="text-gray-400 hover:text-gray-600">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
