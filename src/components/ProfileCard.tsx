import { Crown } from "lucide-react";
import { CountryFlag } from "./common/CountryFlag";

// Utility function to generate social media links
const getSocialLink = (platform: string, value: string): string | undefined => {
  if (!value) return undefined
  
  switch (platform) {
    case 'instagram':
      return value.startsWith('@') ? `https://instagram.com/${value.slice(1)}` : `https://instagram.com/${value}`
    case 'facebook':
      return value.includes('facebook.com') ? value : `https://facebook.com/${value}`
    case 'snapchat':
      return value.startsWith('@') ? `https://snapchat.com/add/${value.slice(1)}` : `https://snapchat.com/add/${value}`
    case 'twitter':
      return value.startsWith('@') ? `https://twitter.com/${value.slice(1)}` : `https://twitter.com/${value}`
    case 'tiktok':
      return value.startsWith('@') ? `https://tiktok.com/${value}` : `https://tiktok.com/@${value}`
    case 'youtube':
      return value.includes('youtube.com') ? value : value.startsWith('@') ? `https://youtube.com/${value}` : `https://youtube.com/c/${value}`
    case 'twitch':
      return `https://twitch.tv/${value}`
    case 'reddit':
      return value.startsWith('u/') ? `https://reddit.com/${value}` : `https://reddit.com/u/${value}`
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
          <span className="text-gray-600">50 Summit</span>
          <span>
            {(stats?.trainer_level || 0) >= 50 ? "Complete" : "In Progress"}
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
