import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { Crown } from "../icons/Crown"
import { Trophy, ChevronDown, Upload } from "lucide-react"
import { useMobile } from "../../hooks/useMobile"
import { dashboardService, type LeaderboardEntry } from "../../services/dashboardService"
import { useAuth } from "../../contexts/AuthContext"
import { supabase } from "../../supabaseClient"
import { getCountryFlag } from "../../utils/countryFlags"
import firstPlaceSvg from "/images/1st.svg"
import secondPlaceSvg from "/images/2nd.svg"
import thirdPlaceSvg from "/images/3rd.svg"


interface LeaderboardViewProps {
  userType: "trial" | "upgraded"
}

export function LeaderboardView({ userType }: LeaderboardViewProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"trainers" | "country" | "team">("trainers")
  const [timePeriod, setTimePeriod] = useState<"weekly" | "monthly" | "alltime">("monthly")
  const [sortBy, setSortBy] = useState<"xp" | "catches" | "distance" | "pokestops">("xp")
  const [lockedExpanded, setLockedExpanded] = useState(false)
  const [liveExpanded, setLiveExpanded] = useState(true)
  const [webLiveExpanded, setWebLiveExpanded] = useState(true)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const isMobile = useMobile()


  // Dropdown states
  const [showTeamsDropdown, setShowTeamsDropdown] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showStatsDropdown, setShowStatsDropdown] = useState(false)
  const [showProxyDropdown, setShowProxyDropdown] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string>('All Teams')
  const [selectedCountry, setSelectedCountry] = useState<string>('All Country')

  
  // Filter states
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string | null>(null)
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string | null>(null)
  
  // Dropdown data
  const [teams, setTeams] = useState<Array<{id: string, name: string, color: string}>>([])
  const [countries, setCountries] = useState<Array<{code: string, name: string, flag: string}>>([])
  // Removed unused tabs and timePeriods arrays

  const sortOptions = [
    { id: "xp" as const, label: "Total XP" },
    { id: "catches" as const, label: "Pokemon Caught" },
    { id: "distance" as const, label: "Distance Walked" },
    { id: "pokestops" as const, label: "Pokestops Visited" },
  ]

  // Load leaderboard data when filters change
  useEffect(() => {
    if (user) {
      loadLeaderboardData()
    }
  }, [user, activeTab, timePeriod, sortBy, selectedTeamFilter, selectedCountryFilter])

  // Load dropdown data when component mounts
  useEffect(() => {
    if (user) {
      fetchTeams()
      fetchCountries()
    }
  }, [user])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-dropdown]')) {
        setShowTeamsDropdown(false)
        setShowCountryDropdown(false)
        setShowStatsDropdown(false)
        setShowProxyDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadLeaderboardData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const params = {
        period: timePeriod === 'alltime' ? 'all-time' as const : timePeriod,
        sortBy,
        view: activeTab === 'trainers' ? 'all' as const : activeTab,
        filterValue: selectedTeamFilter || selectedCountryFilter || undefined
      }

      console.log('Loading leaderboard with params:', params)
      const result = await dashboardService.getLeaderboard(params)

      if (result.error) {
        throw new Error(result.error.message || 'Failed to load leaderboard')
      }

      let filteredData = result.data || []

      // Apply client-side filtering if needed
      if (selectedTeamFilter && selectedTeamFilter !== 'all') {
        filteredData = filteredData.filter(entry => 
          entry.team_color && entry.team_color.toLowerCase() === selectedTeamFilter.toLowerCase()
        )
      }

      if (selectedCountryFilter && selectedCountryFilter !== 'all') {
        filteredData = filteredData.filter(entry => 
          entry.country && entry.country.toLowerCase() === selectedCountryFilter.toLowerCase()
        )
      }

      console.log('Leaderboard data loaded and filtered:', filteredData)
      setLeaderboardData(filteredData)
    } catch (err) {
      console.error('Error loading leaderboard:', err)
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
      // Don't clear existing data on error to prevent Live section from disappearing
      // setLeaderboardData([])
    } finally {
      setLoading(false)
    }
  }



  // Fetch dropdown data functions
  const fetchTeams = async () => {
    try {
      // Fetch unique teams from the database
      const { data, error } = await supabase
        .from('profiles')
        .select('team_color')
        .not('team_color', 'is', null)
        .not('team_color', 'eq', '')
      
      if (error) throw error
      
      // Process teams data
      const uniqueTeams = Array.from(new Set(data?.map(p => p.team_color) || []))
      const teamsData = uniqueTeams.map(teamColor => ({
        id: teamColor,
        name: getTeamColor(teamColor),
        color: getTeamColorHex(teamColor)
      }))
      
      setTeams(teamsData)
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchCountries = async () => {
    try {
      // Fetch unique countries from the database
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .not('country', 'is', null)
        .not('country', 'eq', '')
      
      if (error) throw error
      
      // Process countries data
      const uniqueCountries = Array.from(new Set(data?.map(p => p.country) || []))
      const countriesData = await Promise.all(
        uniqueCountries.map(async (countryName) => {
          try {
            const countryInfo = await getCountryFlag(countryName)
            return {
              code: countryInfo.code,
              name: countryInfo.name,
              flag: countryInfo.flagUrl // Use the actual flag URL
            }
          } catch (error) {
            return {
              code: countryName,
              name: countryName,
              flag: 'https://flagcdn.com/w40/xx.png' // Fallback flag
            }
          }
        })
      )
      
      setCountries(countriesData.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error('Error fetching countries:', error)
    }
  }





  // Dropdown click handlers
  const handleTeamsClick = () => {
    setShowTeamsDropdown(!showTeamsDropdown)
    setShowCountryDropdown(false)
    setShowProxyDropdown(false)
  }

  const handleCountryClick = () => {
    setShowCountryDropdown(!showCountryDropdown)
    setShowTeamsDropdown(false)
    setShowProxyDropdown(false)
  }

  const handleSortClick = () => {
    setShowProxyDropdown(!showProxyDropdown)
    setShowTeamsDropdown(false)
    setShowCountryDropdown(false)
  }

  // Selection handlers
  const handleTeamSelect = (team: {id: string, name: string, color: string}) => {
    setSelectedTeam(team.name)
    setShowTeamsDropdown(false)
    
    // Set filter value
    if (team.id === 'all') {
      setSelectedTeamFilter(null)
    } else {
      setSelectedTeamFilter(team.id)
    }
  }

  const handleCountrySelect = (country: {code: string, name: string, flag: string}) => {
    setSelectedCountry(country.name)
    setShowCountryDropdown(false)
    
    // Set filter value
    if (country.code === 'all') {
      setSelectedCountryFilter(null)
    } else {
      setSelectedCountryFilter(country.name)
    }
  }

  const handleSortSelect = (option: {id: string, label: string}) => {
    setSortBy(option.id as "xp" | "catches" | "distance" | "pokestops")
    setShowProxyDropdown(false)
  }

  // Clear filters function
  const clearFilters = () => {
    setSelectedTeamFilter(null)
    setSelectedCountryFilter(null)
    setSelectedTeam('All Teams')
    setSelectedCountry('All Country')
  }

  // Update tab selection to clear filters
  const handleTabChange = (tab: "trainers" | "country" | "team") => {
    setActiveTab(tab)
    clearFilters()
  }

  // Handle upgrade button click - redirect to upgrade page
  const handleUpgrade = () => {
    navigate('/upgrade')
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      
      // Get the period name for the filename
      const periodName = timePeriod === 'alltime' ? 'All-Time' : 
                        timePeriod === 'weekly' ? 'Weekly' : 'Monthly'
      
      console.log('Starting image export for:', periodName)
      
      // Create simple leaderboard data export
      const leaderboardData = processedData.slice(0, 10) // Top 10 players
      
      // Create canvas for the card
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Canvas context not available')
      }
      
      // Set canvas size
      canvas.width = 600
      canvas.height = 800
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#667eea')
      gradient.addColorStop(1, '#764ba2')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw card background
      const cardX = 40
      const cardY = 40
      const cardWidth = canvas.width - 80
      const cardHeight = canvas.height - 80
      
      // Card shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(cardX + 5, cardY + 5, cardWidth, cardHeight)
      
      // Card background
      ctx.fillStyle = 'white'
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight)
      
      // Header
      ctx.fillStyle = '#DC2627'
      ctx.font = 'bold 28px Poppins'
      ctx.textAlign = 'center'
      ctx.fillText('🏆 PlayerZero Leaderboard', canvas.width / 2, cardY + 60)
      
      // Subtitle
      ctx.fillStyle = '#666'
      ctx.font = '16px Poppins'
      ctx.fillText(`${periodName} Rankings • ${new Date().toLocaleDateString()}`, canvas.width / 2, cardY + 90)
      
      // Header line
      ctx.strokeStyle = '#DC2627'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cardX + 30, cardY + 110)
      ctx.lineTo(cardX + cardWidth - 30, cardY + 110)
      ctx.stroke()
      
      // Draw players
      let yPos = cardY + 140
      
      leaderboardData.forEach((player, index) => {
        const playerHeight = 50
        const playerY = yPos + (index * 60)
        
        // Player background
        let bgColor = '#f8f9fa'
        if (index === 0) bgColor = '#FFD700'
        else if (index === 1) bgColor = '#C0C0C0'
        else if (index === 2) bgColor = '#CD7F32'
        
        ctx.fillStyle = bgColor
        ctx.fillRect(cardX + 20, playerY, cardWidth - 40, playerHeight)
        
        // Left border
        ctx.fillStyle = index < 3 ? bgColor : '#DC2627'
        ctx.fillRect(cardX + 20, playerY, 4, playerHeight)
        
        // Rank
        ctx.fillStyle = '#DC2627'
        ctx.font = 'bold 20px Poppins'
        ctx.textAlign = 'left'
        if (index < 3) {
          // For SVG medals, we would need to load and draw the SVG
          // For now, keeping emojis in export to maintain functionality
          const rankText = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
          ctx.fillText(rankText, cardX + 35, playerY + 32)
        } else {
          const rankText = `#${index + 1}`
          ctx.fillText(rankText, cardX + 35, playerY + 32)
        }
        
        // Name
        ctx.fillStyle = '#333'
        ctx.font = '600 16px Poppins'
        ctx.fillText(player.name, cardX + 90, playerY + 32)
        
        // Stats
        ctx.fillStyle = '#DC2627'
        ctx.font = 'bold 16px Poppins'
        ctx.textAlign = 'right'
        const statValue = typeof player.statValue === 'number' ? formatNumber(player.statValue) : player.statValue
        ctx.fillText(`${statValue} ${getStatLabel()}`, cardX + cardWidth - 40, playerY + 32)
      })
      
      // Footer
      const footerY = yPos + (leaderboardData.length * 60) + 40
      ctx.strokeStyle = '#eee'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cardX + 30, footerY)
      ctx.lineTo(cardX + cardWidth - 30, footerY)
      ctx.stroke()
      
      ctx.fillStyle = '#666'
      ctx.font = '14px Poppins'
      ctx.textAlign = 'center'
      ctx.fillText('Generated from PlayerZero App • Keep grinding! 🔥', canvas.width / 2, footerY + 30)
      
      // Convert canvas to image and download
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      
      // Create download link
      const link = document.createElement('a')
      const fileName = `PlayerZero-${periodName}-Leaderboard-${new Date().toISOString().split('T')[0]}.png`
      link.download = fileName
      link.href = dataUrl
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('Leaderboard image exported successfully:', fileName)
      alert('Leaderboard image downloaded successfully!')
    } catch (error) {
      console.error('Failed to export leaderboard image:', error)
      alert('Failed to export leaderboard image. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  // Helper functions for data formatting
  const formatNumber = (num: number | null | undefined) => {
    if (!num) return '0'
    return num.toLocaleString()
  }

  const formatDistance = (distance: number | null | undefined) => {
    if (!distance) return '0.0'
    return distance.toFixed(1)
  }

  const getCountryFlagUrl = (countryName: string) => {
    // Map country names to flag URLs using the same logic as countryFlags.ts
    const countryToCode: { [key: string]: string } = {
      'united states': 'us', 'usa': 'us', 'us': 'us',
      'canada': 'ca', 'united kingdom': 'gb', 'uk': 'gb', 'england': 'gb',
      'australia': 'au', 'germany': 'de', 'france': 'fr', 'spain': 'es',
      'italy': 'it', 'japan': 'jp', 'china': 'cn', 'india': 'in',
      'brazil': 'br', 'mexico': 'mx', 'argentina': 'ar', 'russia': 'ru',
      'netherlands': 'nl', 'sweden': 'se', 'norway': 'no', 'denmark': 'dk',
      'finland': 'fi', 'switzerland': 'ch', 'austria': 'at', 'belgium': 'be',
      'portugal': 'pt', 'poland': 'pl', 'czech republic': 'cz', 'hungary': 'hu',
      'romania': 'ro', 'ukraine': 'ua', 'croatia': 'hr', 'serbia': 'rs',
      'greece': 'gr', 'turkey': 'tr', 'israel': 'il', 'egypt': 'eg',
      'south africa': 'za', 'nigeria': 'ng', 'kenya': 'ke', 'morocco': 'ma',
      'chile': 'cl', 'peru': 'pe', 'colombia': 'co', 'venezuela': 've',
      'thailand': 'th', 'singapore': 'sg', 'malaysia': 'my', 'philippines': 'ph',
      'indonesia': 'id', 'vietnam': 'vn', 'south korea': 'kr', 'korea': 'kr',
      'new zealand': 'nz', 'ireland': 'ie'
    }
    
    const lowerName = countryName?.toLowerCase() || ''
    const countryCode = countryToCode[lowerName]
    
    if (countryCode) {
      return `https://flagcdn.com/w40/${countryCode}.png`
    }
    
    return 'https://flagcdn.com/w40/xx.png' // Fallback flag
  }

  // Team colors matching ProfileInfo implementation
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

  const getTeamColor = (teamColor: string) => {
    if (teamColor) {
      const team = TEAM_COLORS.find(t => t.value === teamColor.toLowerCase())
      return team?.label || teamColor.charAt(0).toUpperCase() + teamColor.slice(1)
    }
    return "Unknown"
  }

  const getStatValue = (entry: LeaderboardEntry) => {
    switch (sortBy) {
      case 'xp':
        return formatNumber(entry.total_xp || entry.xp_delta || 0)
      case 'catches':
        return formatNumber(entry.pokemon_caught || entry.catches_delta || 0)
      case 'distance':
        return formatDistance(entry.distance_walked || entry.distance_delta || 0)
      case 'pokestops':
        return formatNumber(entry.pokestops_visited || entry.pokestops_delta || 0)
      default:
        return '0'
    }
  }

  const getStatLabel = () => {
    switch (sortBy) {
      case 'xp': return 'Total XP'
      case 'catches': return 'Pokemon'
      case 'distance': return 'Km'
      case 'pokestops': return 'Stops'
      default: return 'Points'
    }
  }

  // Process leaderboard data for display
  const processedData = leaderboardData.map((entry, index) => ({
    rank: index + 1,
    name: entry.trainer_name,
    countryName: entry.country,
    countryFlag: getCountryFlagUrl(entry.country),
    team: getTeamColor(entry.team_color),
    teamColor: entry.team_color, // Keep raw team color for web view
    statValue: getStatValue(entry),
    medal: index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : null,
    profileId: entry.profile_id
  }))

  const lockedResults = processedData.slice(0, 3)
  // Responsive Live section: Mobile shows all users, Web shows only top 3
  const liveResults = isMobile ? processedData : processedData.slice(0, 3)
  
  // Debug logging for Live section
  console.log('Data processing - isMobile:', isMobile, 'leaderboardData length:', leaderboardData.length, 'processedData length:', processedData.length, 'liveResults length:', liveResults.length)

  const getMedalIcon = (medal: string | null) => {
    if (medal === "gold")
      return (
        <img 
          src={firstPlaceSvg} 
          alt="1st place" 
          style={{ 
            width: '30px', 
            height: '30px',
            flex: 'none',
            order: 0,
            flexGrow: 0
          }} 
        />
      )
    if (medal === "silver")
      return (
        <img 
          src={secondPlaceSvg} 
          alt="2nd place" 
          style={{ 
            width: '30px', 
            height: '30px',
            flex: 'none',
            order: 0,
            flexGrow: 0
          }} 
        />
      )
    if (medal === "bronze")
      return (
        <img 
          src={thirdPlaceSvg} 
          alt="3rd place" 
          style={{ 
            width: '30px', 
            height: '30px',
            flex: 'none',
            order: 0,
            flexGrow: 0
          }} 
        />
      )
    return null
  }

  // Web-specific rendering functions
  const renderWebLeaderboard = () => {
    return (
      <>
        {/* Frame 588 - Time Period Tabs */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0px',
          width: '826px',
          height: '48px',
          borderRadius: '6px',
          flex: 'none',
          order: 1,
          alignSelf: 'stretch',
          flexGrow: 0,
        }}>
          {/* Frame 636 - Time Period Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0px',
            margin: '0 auto',
            width: '240px',
            height: '36px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
          }}>
            {/* Weekly */}
            <button
              onClick={() => setTimePeriod('weekly')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0px 8px',
                gap: '10px',
                width: '80px',
                height: '36px',
                flex: 'none',
                order: 0,
                flexGrow: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{
                width: '45px',
                height: '18px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                color: timePeriod === 'weekly' ? '#DC2627' : '#000000',
                textDecorationLine: timePeriod === 'weekly' ? 'underline' : 'none',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                Weekly
              </span>
            </button>

            {/* Monthly */}
            <button
              onClick={() => setTimePeriod('monthly')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '0px 8px',
                width: '80px',
                height: '36px',
                borderRadius: '4px',
                flex: 'none',
                order: 1,
                flexGrow: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{
                width: '50px',
                height: '18px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                textDecorationLine: timePeriod === 'monthly' ? 'underline' : 'none',
                color: timePeriod === 'monthly' ? '#DC2627' : '#000000',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                Monthly
              </span>
            </button>

            {/* All-time */}
            <button
              onClick={() => setTimePeriod('alltime')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0px 8px',
                gap: '10px',
                width: '80px',
                height: '36px',
                flex: 'none',
                order: 2,
                flexGrow: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{
                width: '47px',
                height: '18px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                color: timePeriod === 'alltime' ? '#DC2627' : '#000000',
                textDecorationLine: timePeriod === 'alltime' ? 'underline' : 'none',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                All time
              </span>
            </button>
          </div>
        </div>

        {/* Frame 586 - Live Results Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '12px 8px',
            gap: '8px',
            width: '826px',
            height: '259px',
            background: 'rgba(0, 0, 0, 0.1)',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
            flex: 'none',
            order: 2,
            flexGrow: 0,
          }}>
          {renderWebLiveResults()}
          </div>

        {/* Frame 605 - Monthly Results Container */}
        <div style={{
          /* Frame 605 */
          /* Auto layout */
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '0px',
          gap: '24px',
          width: '826px',
          height: '627px',
          /* Inside auto layout */
          flex: 'none',
          order: 3,
          flexGrow: 0,
        }}>
          {/* Frame 530 - Monthly Leaderboard */}
          <div style={{
            /* Frame 530 */
            /* Auto layout */
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '12px 8px',
            gap: '8px',
            width: '826px',
            height: '627px',
            background: 'rgba(0, 0, 0, 0.1)',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
            borderRadius: '8px',
            /* Inside auto layout */
            flex: 'none',
            order: 0,
            alignSelf: 'stretch',
            flexGrow: 0,
          }}>
            {renderWebMonthlyResults()}
          </div>
        </div>
      </>
    )
  }

  const renderWebLiveResults = () => {
    return (
      <>
        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '0px',
          gap: '16px',
          width: '810px',
          height: '24px',
          flex: 'none',
          order: 0,
          alignSelf: 'stretch',
          flexGrow: 0,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0px',
            gap: '8px',
            margin: '0',
            width: '104px',
            height: '24px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
          }}>
            <Trophy style={{
              width: '24px',
              height: '24px',
              color: '#DC2627',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }} />
            <span style={{
              width: '32px',
              height: '24px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '24px',
              color: '#DC2627',
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              Live
            </span>
          </div>

          {/* Dropdown Button */}
          <div 
            style={{
              cursor: 'pointer'
            }}
            onClick={() => setWebLiveExpanded(!webLiveExpanded)}
          >
            <svg 
              width="38" 
              height="24" 
              viewBox="0 0 38 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: webLiveExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            >
              <rect x="0.5" y="0.5" width="37" height="23" rx="11.5" stroke="black"/>
              <path d="M18.7642 14.4707C18.8267 14.5332 18.9121 14.5684 19.0005 14.5684C19.0887 14.5683 19.1734 14.5331 19.2358 14.4707L23.5962 10.1094L23.1245 9.63867L19.354 13.4102L19.0005 13.7637L14.8755 9.63867L14.4038 10.1104L18.7642 14.4707Z" fill="black" stroke="black"/>
            </svg>
          </div>
        </div>

        {/* Top 3 Results - Conditionally Rendered */}
        {webLiveExpanded && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '0px',
            width: '812px',
            flex: 'none',
            order: 1,
            flexGrow: 0,
            gap: '8px',
          }}>
            {liveResults && liveResults.length > 0 ? (
              liveResults.map((player, index) => renderWebMonthlyPlayerCard(player, index))
            ) : (
              // No Data State
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100px',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <Trophy style={{
                  width: '32px',
                  height: '32px',
                  color: '#cccccc'
                }} />
                <span style={{
                  fontFamily: 'Poppins',
                  fontSize: '14px',
                  color: '#999999',
                  fontWeight: 400
                }}>
                  No live data available
                </span>
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  const renderWebMonthlyResults = () => {
    const allMainResults = processedData.slice(3) // All players except top 3 (which go to Live)
    
    return (
      <>
        {/* Frame 573 - Header */}
        <div style={{
          /* Frame 573 */
          /* Auto layout */
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '0px',
          gap: '13px',
          width: '212px',
          height: '24px',
          /* Inside auto layout */
          flex: 'none',
          order: 0,
          flexGrow: 0,
        }}>
          {/* material-symbols:trophy-outline */}
          <Trophy style={{
            width: '24px',
            height: '24px',
            /* Inside auto layout */
            flex: 'none',
            order: 0,
            flexGrow: 0,
            /* Vector */
            position: 'relative',
            background: '#000000',
          }} />
          {/* Monthly Leaderboard */}
          <span style={{
            width: '175px',
            height: '24px',
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 600,
            fontSize: '16px',
            lineHeight: '24px',
            /* identical to box height */
            color: '#000000',
            /* Inside auto layout */
            flex: 'none',
            order: 1,
            flexGrow: 0,
          }}>
            {timePeriod === 'alltime' ? 'All-Time Leaderboard' : 
             timePeriod === 'weekly' ? 'Weekly Leaderboard' : 'Monthly Leaderboard'}
          </span>
        </div>



        {/* Frame 574 - Main Results Container */}
        {allMainResults.length > 0 && (
        <div style={{
          /* Frame 574 */
          /* Auto layout */
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '0px',
          width: '810px',
          borderRadius: '8px',
          /* Inside auto layout */
          flex: 'none',
            order: 2,
          flexGrow: 0,
        }}>

            {allMainResults.map((player, index) => renderWebMonthlyPlayerCard(player, index + 3))}
        </div>
        )}
      </>
    )
  }

  const renderWebMonthlyPlayerCard = (player: any, index: number) => {
    const teamColorHex = getTeamColorHex(player.teamColor || player.team)
    
    return (
      <div key={index} style={{
        /* Frame 612 */
        /* Auto layout */
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0px',
        width: '812px',
        height: '68px',
        filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
        borderRadius: '8px',
        /* Inside auto layout */
        flex: 'none',
        order: 0,
        flexGrow: 0,
        ...(index === 0 && {
          border: '4px solid #DC2627'
        })
      }}>
        {/* Frame 578 - Player Card Content */}
        <div style={{
          /* Frame 578 */
          /* Auto layout */
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          width: '100%',
          height: '58px',
          background: '#FFFFFF',
          borderRadius: '4px',
          /* Inside auto layout */
          flex: 'none',
          order: 0,
          flexGrow: 0,
        }}>
          {/* Frame 582 - Left Section */}
          <div style={{
            /* Frame 582 */
            /* Auto layout */
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0px',
            gap: '15px',
            height: '33px',
            /* Inside auto layout */
            flex: 'none',
            order: 0,
            flexGrow: 0,
          }}>
            {/* Rank Badge */}
            <div style={{
              /* Auto layout */
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0px',
              gap: '10px',
              width: '24px',
              height: '24px',
              background: '#DC2627',
              borderRadius: '2000px',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}>
              {player.rank <= 3 ? (
                <img 
                  src={player.rank === 1 ? firstPlaceSvg : 
                       player.rank === 2 ? secondPlaceSvg : thirdPlaceSvg} 
                  alt={`${player.rank === 1 ? '1st' : player.rank === 2 ? '2nd' : '3rd'} place`}
                  style={{
                    width: '30px',
                    height: '30px',
                    flex: 'none',
                    order: 0,
                    flexGrow: 0
                  }}
                />
              ) : (
              <span style={{
                width: '6px',
                height: '21px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '21px',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                color: '#FFFFFF',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                {player.rank}
              </span>
              )}
            </div>

            {/* Frame 580 - Player Info */}
            <div style={{
              /* Frame 580 */
              /* Auto layout */
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '0px',
              width: '120px',
              height: '33px',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              {/* Player Name */}
              <span style={{
                width: '120px',
                height: '18px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                /* identical to box height */
                textAlign: 'left',
                color: '#000000',
                /* Inside auto layout */
                flex: 'none',
                order: 0,
                flexGrow: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {player.name}
              </span>

              {/* Frame 22 - Country and Team */}
              <div style={{
                /* Frame 22 */
                /* Auto layout */
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                padding: '0px',
                gap: '12px',
                width: '120px',
                height: '15px',
                /* Inside auto layout */
                flex: 'none',
                order: 1,
                flexGrow: 0,
              }}>
                {/* Country Flag */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '15px',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  <img 
                    src={player.countryFlag}
                    alt={`Flag of ${player.countryName}`}
                    style={{
                      width: '20px',
                      height: '15px',
                      objectFit: 'cover',
                      borderRadius: '2px',
                      border: '1px solid #e0e0e0'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = document.createElement('span');
                      fallback.textContent = '🌍';
                      fallback.style.cssText = 'font-size: 16px; line-height: 15px; display: flex; align-items: center; justify-content: center;';
                      target.parentNode?.insertBefore(fallback, target);
                    }}
                  />
                </div>

                {/* Frame 584 - Team Info */}
                <div style={{
                  /* Frame 584 */
                  /* Auto layout */
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: '0px',
                  gap: '5px',
                  height: '15px',
                  /* Inside auto layout */
                  flex: '1',
                  order: 1,
                  flexGrow: 0,
                }}>
                  {/* Team Color Circle - Ellipse 3 */}
                  <div style={{
                    /* Ellipse 3 */
                    width: '8px',
                    height: '8px',
                    background: teamColorHex,
                    borderRadius: '50%',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                  }} />
                  
                  {/* Team Name */}
                  <span style={{
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '9px',
                    lineHeight: '15px',
                    textAlign: 'left',
                    color: teamColorHex,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '45px',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 1,
                    flexGrow: 0,
                  }}>
                    {player.team}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Frame 581 - Stats Section */}
          <div style={{
            /* Frame 581 */
            /* Auto layout */
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            padding: '0px',
            width: '65px',
            height: '33px',
            /* Inside auto layout */
            flex: 'none',
            order: 1,
            flexGrow: 0,
          }}>
            {/* Stat Value */}
            <span style={{
              width: '65px',
              height: '18px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              /* identical to box height */
              textAlign: 'right',
              color: '#000000',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}>
              {formatNumber(player.statValue)}
            </span>

            {/* Stat Label */}
            <span style={{
              width: '65px',
              height: '15px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '10px',
              lineHeight: '15px',
              /* identical to box height */
              textAlign: 'right',
              color: '#353535',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              {getStatLabel()}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Removed unused renderWebPlayerCard function



  // Removed unused getRankBadgeColor function

  const getTeamColorHex = (teamInput: string) => {
    if (!teamInput) return '#DC2627'
    
    const team = TEAM_COLORS.find(t => t.value === teamInput.toLowerCase())
    return team?.color || '#DC2627'
  }

  return (
    <>
      {/* Web View */}
      {!isMobile && (
        <div style={{
          /* Frame 607 - Main Web Container */
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 60px',
          gap: '27px',
          position: 'absolute',
          width: '946px',
          height: 'auto',
          minHeight: '1236px',
          left: 'calc(50% - 946px/2)',
          top: '117px',
          background: 'rgba(132, 130, 130, 0.12)',
          borderRadius: '12px',
        }}>
          {/* Frame 606 - Header Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0px',
            gap: '13px',
            width: '826px',
            height: '153px',
            flex: 'none',
            order: 0,
            alignSelf: 'stretch',
            flexGrow: 0,
          }}>
            {/* Community Leaderboards Title */}
            <h1 style={{
              width: '826px',
              height: '31px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '24px',
              lineHeight: '31px',
              textAlign: 'center',
              color: '#000000',
              flex: 'none',
              order: 0,
              alignSelf: 'stretch',
              flexGrow: 0,
            }}>
              Community Leaderboards
            </h1>

            {/* Frame 577 - Main Tab Navigation */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0px',
              gap: '8px',
              width: '826px',
              height: '48px',
              borderRadius: '6px',
              flex: 'none',
              order: 1,
              alignSelf: 'stretch',
              flexGrow: 0,
            }}>
              {/* All Trainers */}
              <button
                onClick={() => handleTabChange('trainers')}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px 8px',
                  gap: '10px',
                  margin: '0 auto',
                  width: '90px',
                  height: '36px',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  width: '50px',
                  height: '18px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '18px',
                  color: activeTab === 'trainers' ? '#DC2627' : '#000000',
                  textDecorationLine: activeTab === 'trainers' ? 'underline' : 'none',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  Trainers
                </span>
              </button>

              {/* By Country */}
              <button
                onClick={() => handleTabChange('country')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px 8px',
                  margin: '0 auto',
                  width: '90px',
                  height: '36px',
                  borderRadius: '4px',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  width: '50px',
                  height: '18px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '18px',
                  textDecorationLine: activeTab === 'country' ? 'underline' : 'none',
                  color: activeTab === 'country' ? '#DC2627' : '#000000',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  Country
                </span>
              </button>

              {/* By Team */}
              <button
                onClick={() => handleTabChange('team')}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px 8px',
                  gap: '10px',
                  margin: '0 auto',
                  width: '90px',
                  height: '36px',
                  flex: 'none',
                  order: 2,
                  flexGrow: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  width: '36px',
                  height: '18px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '18px',
                  color: activeTab === 'team' ? '#DC2627' : '#000000',
                  textDecorationLine: activeTab === 'team' ? 'underline' : 'none',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  Team
                </span>
              </button>
            </div>

            {/* Upgrade Button - Web */}
            {userType === "trial" && (
              <div 
                onClick={handleUpgrade}
                style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '0px',
                gap: '8px',
                width: '100%',
                height: '48px',
                background: '#DC2627',
                borderRadius: '8px',
                flex: 'none',
                order: 2,
                flexGrow: 0,
                cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#B91C1C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#DC2627';
                }}
              >
                <Crown style={{
                  width: '24px',
                  height: '24px',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  color: '#FFFFFF',
                }} />
                <span style={{
                  width: '63px',
                  height: '21px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#FFFFFF',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                }}>
                  Upgrade
                </span>
              </div>
            )}
          </div>

          {/* Frame 604 - Main Content Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '0px',
            gap: '18px',
            width: '826px',
            height: '1024px',
            flex: 'none',
            order: 1,
            alignSelf: 'stretch',
            flexGrow: 0,
          }}>
            {/* Frame 625 - Filter Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '0px',
              gap: '25px',
              width: '826px',
              height: '36px',
              flex: 'none',
              order: 0,
              alignSelf: 'stretch',
              flexGrow: 0,
            }}>
              {/* All Teams Dropdown */}
              <div 
                data-dropdown
                style={{
                  position: 'relative',
                  width: '180px',
                  height: '36px',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                <div 
                  onClick={handleTeamsClick}
                  style={{
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 8px',
                gap: '8px',
                    width: '180px',
                height: '36px',
                border: '1px solid #000000',
                borderRadius: '6px',
                    cursor: 'pointer',
                    background: '#FFFFFF',
                  }}>
                  <span style={{
                    width: '120px',
                    height: '18px',
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    fontSize: '12px',
                    lineHeight: '18px',
                    color: selectedTeamFilter ? '#DC2627' : '#000000',
                flex: 'none',
                order: 0,
                flexGrow: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {selectedTeam}
                  </span>
                  <ChevronDown style={{
                    width: '16px',
                    height: '16px',
                    color: '#000000',
                    flex: 'none',
                    order: 1,
                    flexGrow: 0,
                    transform: showTeamsDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }} />
                </div>
                
                {/* Teams Dropdown Menu */}
                {showTeamsDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '40px',
                    left: '0',
                    width: '180px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: '#FFFFFF',
                    border: '1px solid #000000',
                    borderRadius: '6px',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                  }}>
                                         <div 
                       onClick={() => handleTeamSelect({id: 'all', name: 'All Teams', color: '#000000'})}
                       style={{
                         /* Frame 527 */
                         display: 'flex',
                         flexDirection: 'column',
                         justifyContent: 'center',
                         alignItems: 'flex-start',
                         padding: '8px 12px',
                         width: '144px',
                         height: '26px',
                         flex: 'none',
                         order: 0,
                         alignSelf: 'stretch',
                         flexGrow: 0,
                         cursor: 'pointer',
                         borderBottom: '1px solid #f0f0f0',
                         fontFamily: 'Poppins',
                         fontSize: '12px',
                         color: '#000000',
                       }}
                       onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                       onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                     >
                       All Teams
                     </div>
                    {teams.map((team, index) => (
                      <div 
                        key={team.id}
                        onClick={() => handleTeamSelect(team)}
                        style={{
                          /* Frame 527 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '8px 12px',
                          width: '144px',
                          height: '26px',
                          flex: 'none',
                          order: index + 1,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          fontFamily: 'Poppins',
                          fontSize: '12px',
                          color: team.color,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: team.color,
                            borderRadius: '50%',
                          }} />
                          {team.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total XP Dropdown */}
              <div 
                data-dropdown
                style={{
                  position: 'relative',
                  width: '180px',
                  height: '36px',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                }}>
                <div 
                  onClick={handleSortClick}
                  style={{
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    gap: '8px',
                    width: '180px',
                    height: '36px',
                    border: '1px solid #000000',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: '#FFFFFF',
              }}>
                <span style={{
                    width: '120px',
                  height: '18px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '18px',
                  color: '#000000',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                    {sortOptions.find(opt => opt.id === sortBy)?.label || 'Total XP'}
                </span>
                <ChevronDown style={{
                  width: '16px',
                  height: '16px',
                  color: '#000000',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                    transform: showProxyDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                }} />
              </div>

                {/* Sort Options Dropdown Menu */}
                {showProxyDropdown && (
              <div style={{
                    position: 'absolute',
                    top: '40px',
                    left: '0',
                    width: '180px',
                    background: '#FFFFFF',
                    border: '1px solid #000000',
                    borderRadius: '6px',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                  }}>
                    {sortOptions.map((option, index) => (
                      <div 
                        key={option.id}
                        onClick={() => handleSortSelect(option)}
                        style={{
                          /* Frame 527 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '8px 12px',
                          width: '144px',
                          height: '26px',
                          flex: 'none',
                          order: index + 1,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          fontFamily: 'Poppins',
                          fontSize: '12px',
                          color: sortBy === option.id ? '#DC2627' : '#000000',
                          fontWeight: sortBy === option.id ? 600 : 400,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All Country Dropdown */}
              <div 
                data-dropdown
                style={{
                  position: 'relative',
                  width: '180px',
                  height: '36px',
                  flex: 'none',
                  order: 2,
                  flexGrow: 0,
                }}>
                <div 
                  onClick={handleCountryClick}
                  style={{
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 8px',
                gap: '8px',
                    width: '180px',
                height: '36px',
                border: '1px solid #000000',
                borderRadius: '6px',
                    cursor: 'pointer',
                    background: '#FFFFFF',
              }}>
                <span style={{
                    width: '120px',
                  height: '18px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '18px',
                    color: selectedCountryFilter ? '#DC2627' : '#000000',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {selectedCountry}
                </span>
                <ChevronDown style={{
                  width: '16px',
                  height: '16px',
                  color: '#000000',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                    transform: showCountryDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }} />
                </div>
                
                {/* Countries Dropdown Menu */}
                {showCountryDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '40px',
                    left: '0',
                    width: '180px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    background: '#FFFFFF',
                    border: '1px solid #000000',
                    borderRadius: '6px',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                  }}>
                    <div 
                      onClick={() => handleCountrySelect({code: 'all', name: 'All Country', flag: 'https://flagcdn.com/w40/xx.png'})}
                      style={{
                        /* Frame 527 */
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '8px 12px',
                        width: '144px',
                        height: '26px',
                        flex: 'none',
                        order: 0,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0',
                        fontFamily: 'Poppins',
                        fontSize: '12px',
                        color: '#000000',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>🌍</span>
                        All Country
                      </div>
                    </div>
                    {countries.map((country, index) => (
                      <div 
                        key={country.code}
                        onClick={() => handleCountrySelect(country)}
                        style={{
                          /* Frame 527 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '8px 12px',
                          width: '144px',
                          height: '26px',
                          flex: 'none',
                          order: index + 1,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          fontFamily: 'Poppins',
                          fontSize: '12px',
                          color: '#000000',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img 
                            src={country.flag}
                            alt={`Flag of ${country.name}`}
                            style={{
                              width: '20px',
                              height: '15px',
                              objectFit: 'cover',
                              borderRadius: '2px',
                              border: '1px solid #e0e0e0'
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = document.createElement('span');
                              fallback.textContent = '🌍';
                              fallback.style.cssText = 'font-size: 14px; width: 20px; height: 15px; display: flex; align-items: center; justify-content: center;';
                              target.parentNode?.insertBefore(fallback, target);
                            }}
                          />
                          <span style={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {country.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Export Button */}
              <div 
                onClick={handleExport}
                style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px',
                  gap: '8px',
                  width: '180px',
                  height: '36px',
                  border: '1px solid #DC2627',
                  borderRadius: '6px',
                  flex: 'none',
                  order: 3,
                  flexGrow: 0,
                  cursor: 'pointer',
                  background: '#FFFFFF',
                  opacity: exporting ? 0.7 : 1,
                }}>
                <Upload style={{
                  width: '14px',
                  height: '15px',
                  color: '#DC2627',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }} />
                <span style={{
                  width: '39px',
                  height: '18px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '18px',
                  color: '#DC2627',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                }}>
                  {exporting ? 'Exporting...' : 'Export'}
                </span>
              </div>
            </div>

            {/* Continue with remaining web implementation... */}
            {renderWebLeaderboard()}
          </div>

          {/* Footer Text for Web View */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 0px',
            gap: '8px',
            width: '826px',
            flex: 'none',
            order: 2,
            alignSelf: 'stretch',
            flexGrow: 0,
          }}>
            <span style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '21px',
              textAlign: 'center',
              color: '#666666',
            }}>
              © 2024 PlayerZero. All rights reserved.
            </span>
            <span style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '18px',
              textAlign: 'center',
              color: '#999999',
            }}>
              Powering the next generation of Pokemon GO trainers
            </span>
          </div>
        </div>
      )}

      {/* Mobile View */}
      {isMobile && (
        <div className="w-full max-w-7xl mx-auto px-4 py-6">

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
          <button 
            onClick={loadLeaderboardData}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Frame 589 - Trainer/Country/Team Tabs */}
      <div 
        style={{
          /* Frame 589 */
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0px',
          gap: '8px',
          width: '353px',
          height: '48px',
          borderRadius: '6px',
          flex: 'none',
          order: 0,
          flexGrow: 0,
        }}
      >
        {/* All Trainers */}
        <button
          onClick={() => handleTabChange('trainers')}
          style={{
            /* All Trainers */
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0px 8px',
            gap: '10px',
            margin: '0 auto',
            width: '100px',
            height: '48px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span 
            style={{
              /* Trainers */
              width: '50px',
              height: '18px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              textDecorationLine: activeTab === 'trainers' ? 'underline' : 'none',
              color: activeTab === 'trainers' ? '#DC2627' : '#000000',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
            Trainers
          </span>
        </button>

        {/* By Country */}
        <button
          onClick={() => handleTabChange('country')}
          style={{
            /* By Country */
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0px 8px',
            margin: '0 auto',
            width: '100px',
            height: '48px',
            borderRadius: '4px',
            flex: 'none',
            order: 1,
            flexGrow: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span 
            style={{
              /* Country */
              width: '50px',
              height: '18px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              color: activeTab === 'country' ? '#DC2627' : '#000000',
              textDecorationLine: activeTab === 'country' ? 'underline' : 'none',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
            Country
          </span>
        </button>

        {/* By Team */}
        <button
          onClick={() => handleTabChange('team')}
          style={{
            /* By Team */
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0px 8px',
            gap: '10px',
            margin: '0 auto',
            width: '100px',
            height: '48px',
            flex: 'none',
            order: 2,
            flexGrow: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span 
            style={{
              /* Team */
              width: '36px',
              height: '18px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              color: activeTab === 'team' ? '#DC2627' : '#000000',
              textDecorationLine: activeTab === 'team' ? 'underline' : 'none',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
            Team
          </span>
        </button>
      </div>

      {/* Upgrade Button - Desktop */}
      {!isMobile && userType === "trial" && (
        <Button 
          onClick={handleUpgrade}
          className="w-full bg-red-500 hover:bg-red-600 text-white mb-6 h-12"
        >
          <Crown className="w-5 h-5 mr-2" />
          Upgrade
        </Button>
      )}

      {/* Frame 590 - Main Container */}
      <div 
        style={{
          /* Frame 590 */
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0px 8px',
          gap: '20px',
          width: '100%',
          minWidth: '353px',
          maxWidth: '100vw',
          height: 'auto',
          /* Inside auto layout */
          flex: 'none',
          order: 1,
          alignSelf: 'stretch',
          flexGrow: 0,
        }}
      >
        {/* Frame 625 - Sub Container */}
        <div 
          style={{
            /* Frame 625 */
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0px',
            gap: '16px',
            width: '100%',
            maxWidth: '353px',
            height: 'auto',
            /* Inside auto layout */
            flex: 'none',
            order: 0,
            alignSelf: 'stretch',
            flexGrow: 0,
          }}
        >
          {/* Frame 623 - First Row with All Teams and All Countries */}
      <div 
        style={{
          /* Frame 623 */
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '0px',
              gap: '8px',
              width: '100%',
              maxWidth: '353px',
          height: '36px',
              /* Inside auto layout */
          flex: 'none',
              order: 0,
          alignSelf: 'stretch',
          flexGrow: 0,
        }}
      >
            {/* All Teams Dropdown */}
        <div 
              data-dropdown
          style={{
                /* Overall */
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
                justifyContent: 'flex-start',
            alignItems: 'center',
            padding: '4px 8px',
            gap: '8px',
                width: 'calc(50% - 4px)',
                minWidth: '140px',
            height: '36px',
            border: '1px solid #000000',
            borderRadius: '6px',
            cursor: 'pointer',
                /* Inside auto layout */
            flex: 'none',
            order: 0,
            flexGrow: 0,
            background: '#FFFFFF',
                position: 'relative',
          }}
              onClick={() => setShowTeamsDropdown(!showTeamsDropdown)}
        >
          <span 
            style={{
                  /* All Teams */
              fontFamily: 'Poppins',
                  fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              color: '#000000',
                  /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
                {selectedTeam}
          </span>
              {/* Dropdown Icon */}
          <ChevronDown 
            style={{ 
                  width: '16px', 
                  height: '16px', 
                  color: '#000000',
                  marginLeft: 'auto',
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }} 
          />
              
              {/* Dropdown Menu */}
              {showTeamsDropdown && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    right: '0',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #000000',
                    borderRadius: '6px',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  <div 
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'Poppins',
                      borderBottom: selectedTeamFilter === null ? 'none' : '1px solid #f0f0f0',
                      backgroundColor: selectedTeamFilter === null ? '#f8f9fa' : 'transparent',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTeam('All Teams');
                      setSelectedTeamFilter(null);
                      setShowTeamsDropdown(false);
                    }}
                  >
                    All Teams
                  </div>
                  {teams.map((team) => (
                    <div 
                      key={team.id}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: 'Poppins',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: selectedTeamFilter === team.id ? '#f8f9fa' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeam(team.name);
                        setSelectedTeamFilter(team.id);
                        setShowTeamsDropdown(false);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = selectedTeamFilter === team.id ? '#f8f9fa' : 'transparent';
                      }}
                    >
                      <div 
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: team.color,
                        }}
                      />
                      {team.name}
                    </div>
                  ))}
                </div>
              )}
        </div>

            {/* All Countries Dropdown */}
        <div 
              data-dropdown
          style={{
                /* Overall */
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
                justifyContent: 'flex-start',
            alignItems: 'center',
            padding: '4px 8px',
            gap: '8px',
                width: 'calc(50% - 4px)',
                minWidth: '140px',
            height: '36px',
            border: '1px solid #000000',
            borderRadius: '6px',
            cursor: 'pointer',
                /* Inside auto layout */
            flex: 'none',
            order: 1,
            flexGrow: 0,
            background: '#FFFFFF',
                position: 'relative',
              }}
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
            >
              <span 
                style={{
                  /* All Countries */
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '18px',
                  color: '#000000',
                  /* Inside auto layout */
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}
              >
                {selectedCountry}
              </span>
              {/* Dropdown Icon */}
              <ChevronDown 
                style={{ 
                  width: '16px', 
                  height: '16px', 
                  color: '#000000',
                  marginLeft: 'auto',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                }} 
              />
              
              {/* Dropdown Menu */}
              {showCountryDropdown && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    right: '0',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #000000',
                    borderRadius: '6px',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  <div 
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'Poppins',
                      borderBottom: selectedCountryFilter === null ? 'none' : '1px solid #f0f0f0',
                      backgroundColor: selectedCountryFilter === null ? '#f8f9fa' : 'transparent',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCountry('All Country');
                      setSelectedCountryFilter(null);
                      setShowCountryDropdown(false);
                    }}
                  >
                    All Country
                  </div>
                  {countries.map((country) => (
                    <div 
                      key={country.code}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: 'Poppins',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: selectedCountryFilter === country.name ? '#f8f9fa' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCountry(country.name);
                        setSelectedCountryFilter(country.name);
                        setShowCountryDropdown(false);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = selectedCountryFilter === country.name ? '#f8f9fa' : 'transparent';
                      }}
                    >
                      <img 
                        src={country.flag}
                        alt={country.name}
                        style={{
                          width: '16px',
                          height: '12px',
                          objectFit: 'cover',
                          borderRadius: '2px',
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      {country.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Frame 624 - Second Row with Total XP and Export */}
          <div 
            style={{
              /* Frame 624 */
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '0px',
              gap: '8px',
              width: '100%',
              maxWidth: '353px',
              height: '36px',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              alignSelf: 'stretch',
              flexGrow: 0,
            }}
          >
            {/* Total XP Dropdown */}
            <div 
              data-dropdown
              style={{
                /* Scores */
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                padding: '4px 8px',
                gap: '8px',
                width: 'calc(50% - 4px)',
                minWidth: '140px',
                height: '36px',
                border: '1px solid #000000',
                borderRadius: '6px',
                cursor: 'pointer',
                /* Inside auto layout */
                flex: 'none',
                order: 0,
                flexGrow: 0,
                background: '#FFFFFF',
                position: 'relative',
              }}
              onClick={() => setShowStatsDropdown(!showStatsDropdown)}
        >
          <span 
            style={{
                  /* Total XP */
              fontFamily: 'Poppins',
                  fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              color: '#000000',
                  /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
            {sortOptions.find(opt => opt.id === sortBy)?.label || 'Total XP'}
          </span>
              {/* Dropdown Icon */}
          <ChevronDown 
            style={{ 
                  width: '16px', 
                  height: '16px', 
                  color: '#000000',
                  marginLeft: 'auto',
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }} 
          />
              
              {/* Dropdown Menu */}
              {showStatsDropdown && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    right: '0',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #000000',
                    borderRadius: '6px',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {sortOptions.map((option) => (
                    <div 
                      key={option.id}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: 'Poppins',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: sortBy === option.id ? '#f8f9fa' : 'transparent',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option.id);
                        setShowStatsDropdown(false);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = sortBy === option.id ? '#f8f9fa' : 'transparent';
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export Button */}
            <div 
              onClick={handleExport}
              style={{
                /* Export */
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '0px',
                gap: '8px',
                width: 'auto',
                minWidth: '80px',
                height: '36px',
                border: '1px solid #DC2627',
                borderRadius: '4px',
                cursor: 'pointer',
                /* Inside auto layout */
                flex: '0 0 auto',
                order: 1,
                flexGrow: 0,
                background: '#FFFFFF',
                opacity: exporting ? 0.7 : 1,
              }}
            >
              {/* Vector Container */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px',
                  gap: '10px',
                  width: '24px',
                  height: '24px',
                  /* Inside auto layout */
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}
              >
                <Upload 
                  style={{ 
                    /* Vector */
                    width: '14px',
                    height: '15px',
                    color: '#DC2627',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                  }} 
                />
              </div>
              <span 
                style={{
                  /* Export */
                  width: '39px',
                  height: '18px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '18px',
                  color: '#DC2627',
                  /* Inside auto layout */
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                }}
              >
                {exporting ? 'Export...' : 'Export'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Section - Mobile */}
      {isMobile && userType === "trial" && (
        <div className="mb-6" style={{ marginTop: '16px', marginBottom: '16px' }}>
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-red-500 hover:bg-red-600 text-white h-12 mb-2"
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade
          </Button>
          <p className="text-center text-sm text-gray-600">
            To keep tracking your grind and unlock your leaderboard placement, upgrade for $5.99.
          </p>
        </div>
      )}

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
          <button 
            onClick={loadLeaderboardData}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Frame 588 - Time Period Tabs */}
      <div 
        style={{
          /* Frame 588 */
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0px 8px',
          width: '100%',
          minWidth: '353px',
          maxWidth: '100vw',
          height: '48px',
          borderRadius: '6px',
          flex: 'none',
          order: 3,
          alignSelf: 'stretch',
          flexGrow: 0,
        }}
      >
        {/* Frame 627 - Time Period Buttons Container */}
        <div 
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0px',
            width: '240px',
            height: '36px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
          }}
        >
          {/* Weekly */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0px 8px',
              gap: '10px',
              width: '80px',
              height: '36px',
              cursor: 'pointer',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
            onClick={() => setTimePeriod('weekly')}
          >
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                color: timePeriod === 'weekly' ? '#DC2627' : '#000000',
                textDecorationLine: timePeriod === 'weekly' ? 'underline' : 'none',
                textAlign: 'center',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}
            >
              Weekly
            </span>
          </div>

          {/* Monthly */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0px 8px',
              width: '80px',
              height: '36px',
              borderRadius: '4px',
              cursor: 'pointer',
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}
            onClick={() => setTimePeriod('monthly')}
          >
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                color: timePeriod === 'monthly' ? '#DC2627' : '#000000',
                textDecorationLine: timePeriod === 'monthly' ? 'underline' : 'none',
                textAlign: 'center',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}
            >
              Monthly
            </span>
          </div>

          {/* All-time */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0px 8px',
              gap: '10px',
              width: '80px',
              height: '36px',
              cursor: 'pointer',
              flex: 'none',
              order: 2,
              flexGrow: 0,
            }}
            onClick={() => setTimePeriod('alltime')}
          >
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                color: timePeriod === 'alltime' ? '#DC2627' : '#000000',
                textDecorationLine: timePeriod === 'alltime' ? 'underline' : 'none',
                textAlign: 'center',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}
            >
              All time
            </span>
          </div>
        </div>


      </div>

      {/* Component 5 - Locked Results */}
      <div 
        style={{
          /* Component 5 */
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 8px',
          gap: '8px',
          width: '100%',
          minWidth: '353px',
          maxWidth: '100vw',
          height: '213px',
          background: 'rgba(0, 0, 0, 0.1)',
          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.05)',
          borderRadius: '8px',
          flex: 'none',
          order: 4,
          flexGrow: 0,
        }}
      >
        {/* Locked Header */}
        <button
          onClick={() => setLockedExpanded(!lockedExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy style={{ width: '24px', height: '24px', color: '#DC2627' }} />
            <span style={{
              fontFamily: 'Poppins',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '24px',
              color: '#DC2627',
            }}>
              Locked Results
            </span>
          </div>
          <svg 
            width="38" 
            height="24" 
            viewBox="0 0 38 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{
            transform: lockedExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
            }}
          >
            <rect x="0.5" y="0.5" width="37" height="23" rx="11.5" stroke="black"/>
            <path d="M18.7642 14.4707C18.8267 14.5332 18.9121 14.5684 19.0005 14.5684C19.0887 14.5683 19.1734 14.5331 19.2358 14.4707L23.5962 10.1094L23.1245 9.63867L19.354 13.4102L19.0005 13.7637L14.8755 9.63867L14.4038 10.1104L18.7642 14.4707Z" fill="black" stroke="black"/>
          </svg>
        </button>

        {lockedExpanded && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
            maxWidth: '337px',
          }}>
            {lockedResults.map((player, index) => (
              <div
                key={index}
                style={{
                  /* Frame 532/533/534 - Top 3 entries */
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: '4px 16px',
                  gap: '8px',
                  width: '337px',
                  height: '47px',
                  background: player.rank === 1 ? '#FFFFFF' : '#FFFFFF',
                  border: player.rank === 1 ? '3px solid #DC2627' : 'none',
                  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                  borderRadius: '8px',
                  flex: 'none',
                  order: index,
                  alignSelf: 'stretch',
                  flexGrow: 0,
                }}
              >
                {/* Player Info Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  flex: 1,
                }}>
                  {/* Medal Icon */}
                  {getMedalIcon(player.medal)}

                  {/* Name and Location */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}>
                    <span style={{
                      fontFamily: 'Poppins',
                      fontWeight: 600,
                      fontSize: '12px',
                      lineHeight: '18px',
                      color: '#000000',
                    }}>
                      {player.name}
                    </span>
                    
                    {/* Country and Team */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <img 
                        src={player.countryFlag}
                        alt={`Flag of ${player.countryName}`}
                        style={{
                          width: '18px',
                          height: '13px',
                          objectFit: 'cover',
                          borderRadius: '2px',
                          border: '1px solid #e0e0e0'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.createElement('span');
                          fallback.textContent = '🌍';
                          fallback.style.cssText = 'font-size: 14px; line-height: 13px; display: flex; align-items: center; justify-content: center;';
                          target.parentNode?.insertBefore(fallback, target);
                        }}
                      />
                      
                      {/* Team */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          background: '#DC2627',
                          borderRadius: '50%',
                        }} />
                        <span style={{
                          fontFamily: 'Poppins',
                          fontWeight: 400,
                          fontSize: '10px',
                          lineHeight: '15px',
                          color: '#DC2627',
                        }}>
                          {player.team}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '2px',
                }}>
                  <span style={{
                    fontFamily: 'Poppins',
                    fontWeight: 600,
                    fontSize: '12px',
                    lineHeight: '18px',
                    textAlign: 'center',
                    color: '#000000',
                  }}>
                    {player.statValue}
                  </span>
                  <span style={{
                    fontFamily: 'Poppins',
                    fontWeight: 400,
                    fontSize: '10px',
                    lineHeight: '15px',
                    color: '#353535',
                  }}>
                    {getStatLabel()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

             {/* Leaderboard container frame - Live Results */}
       <div 
         style={{
           /* Leaderboard container frame */
           display: 'flex',
           flexDirection: 'column',
           alignItems: 'flex-start',
           padding: '12px 8px',
           gap: '8px',
                    width: '100%',
         minWidth: '353px',
         maxWidth: '100vw',
           height: '661px',
           overflowY: 'scroll',
           background: 'rgba(0, 0, 0, 0.1)',
           boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
           borderRadius: '8px',
           flex: 'none',
           order: 5,
           flexGrow: 0,
         }}
       >
         {/* Live Header */}
         <button
           onClick={() => setLiveExpanded(!liveExpanded)}
           style={{
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'space-between',
             width: '100%',
             padding: '8px 0',
             background: 'transparent',
             border: 'none',
             cursor: 'pointer',
           }}
         >
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Trophy style={{ width: '24px', height: '24px', color: '#DC2627' }} />
             <span style={{
               fontFamily: 'Poppins',
               fontWeight: 600,
               fontSize: '16px',
               lineHeight: '24px',
               color: '#DC2627',
             }}>
               {timePeriod === "monthly" ? "Monthly Leaderboard" : "Live"}
             </span>
           </div>
           <ChevronDown style={{
             width: '20px',
             height: '20px',
             color: '#000000',
             transform: liveExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
             transition: 'transform 0.2s ease'
           }} />
         </button>

         {liveExpanded && (
           <div style={{
             display: 'flex',
             flexDirection: 'column',
             gap: '8px',
             width: '100%',
           }}>
             {liveResults && liveResults.length > 0 ? (
               liveResults.map((player, index) => (
               <div
                 key={index}
                 style={{
                   /* Frame 540 */
                   display: 'flex',
                   flexDirection: 'row',
                   alignItems: 'center',
                   padding: '4px 16px',
                   gap: '8px',
                   width: '337px',
                   height: '47px',
                   background: '#FFFFFF',
                   boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                   borderRadius: '8px',
                   flex: 'none',
                   order: index,
                   alignSelf: 'stretch',
                   flexGrow: 0,
                 }}
               >
                 {/* Player Info Row */}
                 <div style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '12px',
                   flex: 1,
                 }}>
                   {/* Rank Circle */}
                   <div style={{
                     display: 'flex',
                     justifyContent: 'center',
                     alignItems: 'center',
                     width: '24px',
                     height: '24px',
                     background: '#DC2627',
                     borderRadius: '50%',
                   }}>
                     <span style={{
                       fontFamily: 'Poppins',
                       fontWeight: 600,
                       fontSize: '14px',
                       lineHeight: '21px',
                       color: '#FFFFFF',
                     }}>
                       {player.rank}
                     </span>
                   </div>

                   {/* Name and Location */}
                   <div style={{
                     display: 'flex',
                     flexDirection: 'column',
                     gap: '2px',
                   }}>
                     <span style={{
                       fontFamily: 'Poppins',
                       fontWeight: 600,
                       fontSize: '12px',
                       lineHeight: '18px',
                       color: '#000000',
                     }}>
                       {player.name}
                     </span>
                     
                     {/* Country and Team */}
                     <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: '6px',
                     }}>
                       <img 
                         src={player.countryFlag}
                         alt={`Flag of ${player.countryName}`}
                         style={{
                           width: '16px',
                           height: '12px',
                           objectFit: 'cover',
                           borderRadius: '2px',
                           border: '1px solid #e0e0e0'
                         }}
                         onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.style.display = 'none';
                           const fallback = document.createElement('span');
                           fallback.textContent = '🌍';
                           fallback.style.cssText = 'font-size: 14px; line-height: 12px; display: flex; align-items: center; justify-content: center;';
                           target.parentNode?.insertBefore(fallback, target);
                         }}
                       />
                       
                       {/* Team */}
                       <div style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: '4px',
                       }}>
                         <div style={{
                           width: '8px',
                           height: '8px',
                           background: '#DC2627',
                           borderRadius: '50%',
                         }} />
                         <span style={{
                           fontFamily: 'Poppins',
                           fontWeight: 400,
                           fontSize: '10px',
                           lineHeight: '15px',
                           color: '#DC2627',
                         }}>
                           {player.team}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Stats */}
                 <div style={{
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'flex-end',
                   gap: '2px',
                 }}>
                   <span style={{
                     fontFamily: 'Poppins',
                     fontWeight: 600,
                     fontSize: '12px',
                     lineHeight: '18px',
                     color: '#000000',
                   }}>
                     {player.statValue}
                   </span>
                   <span style={{
                     fontFamily: 'Poppins',
                     fontWeight: 400,
                     fontSize: '10px',
                     lineHeight: '15px',
                     color: '#353535',
                   }}>
                     {getStatLabel()}
                   </span>
                 </div>
               </div>
             ))
             ) : (
               // No Data State
               <div style={{
                 display: 'flex',
                 justifyContent: 'center',
                 alignItems: 'center',
                 width: '100%',
                 height: '80px',
                 flexDirection: 'column',
                 gap: '8px'
               }}>
                 <Trophy style={{
                   width: '24px',
                   height: '24px',
                   color: '#cccccc'
                 }} />
                 <span style={{
                   fontFamily: 'Poppins',
                   fontSize: '12px',
                   color: '#999999',
                   fontWeight: 400,
                   textAlign: 'center'
                 }}>
                   No live data available
                 </span>
               </div>
             )}
           </div>
         )}
       </div>
        </div>
      )}
    </>
  )
}
