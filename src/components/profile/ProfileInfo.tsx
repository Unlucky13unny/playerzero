import { Facebook, Instagram } from "lucide-react"
import { Button } from "../ui/button"
import { Crown } from "../icons/Crown"
import { SnapchatIcon } from "../icons/SnapchatIcon"
import { CountryFlag } from "../common/CountryFlag"
import { useMobile } from "../../hooks/useMobile"

// Team colors matching PublicProfile implementation
const TEAM_COLORS = [
  { value: 'blue', label: 'Blue', color: '#0074D9', team: 'Blue Team' },
  { value: 'red', label: 'Red', color: '#FF4136', team: 'Red Team' },
  { value: 'yellow', label: 'Yellow', color: '#FFDC00', team: 'Yellow Team' },
  { value: 'black', label: 'Black', color: '#111111', team: 'Black Team' },
  { value: 'green', label: 'Green', color: '#2ECC40', team: 'Green Team' },
  { value: 'orange', label: 'Orange', color: '#FF851B', team: 'Orange Team' },
  { value: 'purple', label: 'Purple', color: '#B10DC9', team: 'Purple Team' },
  { value: 'pink', label: 'Pink', color: '#F012BE', team: 'Pink Team' }
]

interface ProfileInfoProps {
  viewMode: "public" | "private" | "team" | "own"
  userType: "trial" | "upgraded"
  profile?: any
}

export function ProfileInfo({ viewMode, userType, profile }: ProfileInfoProps) {
  const isMobile = useMobile()
  const getModeButton = () => {
    if (viewMode === "public") {
      return (
        <Button size="sm" className="bg-green-100 text-green-700 hover:bg-green-200">
          Public mode
        </Button>
      )
    }
    if (viewMode === "team") {
      return (
        <Button size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
          Team mode
        </Button>
      )
    }
    return (
      <Button size="sm" className="bg-red-100 text-red-700 hover:bg-red-200">
        Private mode
      </Button>
    )
  }

  const getTrainerCode = () => {
    if (!profile?.trainer_code) {
      return "No trainer code"
    }
    if (profile?.trainer_code_private) {
      return "205***********"
    }
    // Format trainer code with spaces like PublicProfile: 2056 5536 4353
    return profile.trainer_code.replace(/(.{4})/g, "$1 ").trim()
  }

  const getTeamName = () => {
    if (profile?.team_color) {
      const team = TEAM_COLORS.find(t => t.value === profile.team_color)
      return team?.label || profile.team_color.charAt(0).toUpperCase() + profile.team_color.slice(1)
    }
    return "Unknown"
  }

  const copyTrainerCode = () => {
    if (profile?.trainer_code && !profile?.trainer_code_private) {
      navigator.clipboard.writeText(profile.trainer_code.replace(/\s/g, ''))
    }
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-black">{profile?.trainer_level || 50}</div>
              <div className="text-lg text-black">L V L</div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-black" style={{ color: '#000000' }}>{profile?.trainer_name || "Unknown Trainer"}</h2>
              <div className="flex items-center gap-1 text-sm text-black">
                {profile?.country && <CountryFlag countryName={profile.country} size={24} />}
                <span style={{ color: '#000000' }}>{profile?.country || "Unknown Country"}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <Facebook className="w-5 h-5 text-blue-600" />
                <Instagram className="w-5 h-5 text-pink-600" />
                <SnapchatIcon className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </div>
          {getModeButton()}
        </div>
        {viewMode === "own" && userType === "trial" && (
          <Button className="bg-red-500 hover:bg-red-600 text-white md:hidden">
            <Crown className="w-4 h-4 mr-1" />
            Upgrade
          </Button>
        )}
      </div>

      <div 
        className="mt-4 text-sm"
        style={{
          /* Frame 517 specifications */
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '8px 0px',
          gap: '16px',
          width: '300px',
          height: isMobile ? '150px' : '200px',
          /* Inside auto layout */
          flex: 'none',
          order: 0,
          flexGrow: 0,
        }}
      >
        <div className="flex justify-between w-full">
          <span className="text-black">Team:</span>
          <span className="font-medium text-black">{getTeamName()}</span>
        </div>
        <div className="flex justify-between w-full">
          <span className="text-black">Start Date:</span>
          <span className="text-black">
            {profile?.start_date ? new Date(profile.start_date).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric'
            }) : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between w-full">
          <span className="text-black">Summit Date:</span>
          <span className="text-black">{(profile?.trainer_level || 0) >= 50 ? 'Complete' : 'In Progress'}</span>
        </div>
        <div className="flex justify-between w-full">
          <span className="text-black">Trainer Code:</span>
          <div className="flex items-center gap-2">
            <span className="text-black">{getTrainerCode()}</span>
            {profile?.trainer_code && !profile?.trainer_code_private && (
              <button 
                className="text-gray-400 hover:text-gray-600"
                onClick={copyTrainerCode}
                title="Copy trainer code"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
