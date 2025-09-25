import { useState, useEffect } from "react"

import { useNavigate } from "react-router-dom"

import { Button } from "../ui/button"

import { Crown } from "../icons/Crown"

import { ChevronDown, Upload } from "lucide-react"

import { useMobile } from "../../hooks/useMobile"

import { dashboardService, type LeaderboardEntry } from "../../services/dashboardService"

import { useAuth } from "../../contexts/AuthContext"

import { supabase } from "../../supabaseClient"

import { getCountryFlag } from "../../utils/countryFlags"

import { PlyrZeroProfileStandalone } from "../profile/PlyrZeroProfileStandalone"

import { useTrialStatus } from "../../hooks/useTrialStatus"

import "../common/UserSearch.css"

import firstPlaceSvg from "/images/1st.svg"

import secondPlaceSvg from "/images/2nd.svg"

import thirdPlaceSvg from "/images/3rd.svg"





interface LeaderboardViewProps {

  userType: "trial" | "upgraded"

}



export function LeaderboardView({ userType }: LeaderboardViewProps) {

  const { user } = useAuth()

  const navigate = useNavigate()

  const trialStatus = useTrialStatus()

  const [activeTab, setActiveTab] = useState<"trainers" | "country" | "team">("trainers")

  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)

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

  const [showDynamicDropdown, setShowDynamicDropdown] = useState(false)

  const [showStatsDropdown, setShowStatsDropdown] = useState(false)

  const [showProxyDropdown, setShowProxyDropdown] = useState(false)

  const [selectedDynamicValue, setSelectedDynamicValue] = useState<string>('All Trainers')



  

  // Filter states

  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string | null>(null)

  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string | null>(null)

  const [selectedTrainerFilter, setSelectedTrainerFilter] = useState<string | null>(null)

  

  // Dropdown data

  const [teams, setTeams] = useState<Array<{id: string, name: string, color: string}>>([])

  const [countries, setCountries] = useState<Array<{code: string, name: string, flag: string}>>([])

  const [trainers, setTrainers] = useState<Array<{id: string, name: string}>>([])

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

  }, [user, activeTab, timePeriod, sortBy, selectedTeamFilter, selectedCountryFilter, selectedTrainerFilter])



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

        setShowDynamicDropdown(false)

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

      console.log(`Leaderboard result for ${timePeriod}:`, {
        dataLength: result.data?.length || 0,
        hasError: !!result.error,
        errorMessage: result.error ? (typeof result.error === 'string' ? result.error : (result.error as any).message || 'Unknown error') : null
      })



      if (result.error) {

        throw new Error(typeof result.error === 'string' ? result.error : (result.error as any).message || 'Failed to load leaderboard')

      }



      let filteredData = result.data || []



      // Extract unique trainers for dropdown (before filtering)

      const uniqueTrainers = Array.from(

        new Set(filteredData.map(entry => entry.trainer_name).filter(Boolean))

      ).map(trainerName => ({

        id: trainerName!.toLowerCase(),

        name: trainerName!

      })).sort((a, b) => a.name.localeCompare(b.name))



      setTrainers(uniqueTrainers)



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



      // Apply trainer filtering if needed

      if (selectedTrainerFilter && selectedTrainerFilter !== 'all') {

        filteredData = filteredData.filter(entry => 

          entry.trainer_name && entry.trainer_name.toLowerCase() === selectedTrainerFilter.toLowerCase()

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

  const handleDynamicDropdownClick = () => {
    // Don't show dropdown for trainers tab - just show "All Trainers"
    if (activeTab === 'trainers') {
      return
    }

    setShowDynamicDropdown(!showDynamicDropdown)

    setShowProxyDropdown(false)

  }



  const handleSortClick = () => {

    setShowProxyDropdown(!showProxyDropdown)

    setShowDynamicDropdown(false)

  }



  // Dynamic selection handler

  const handleDynamicSelect = (item: {id: string, name: string, color?: string, flag?: string}) => {

    setSelectedDynamicValue(item.name)

    setShowDynamicDropdown(false)

    

    // Set appropriate filter based on active tab

    if (activeTab === 'team') {

      if (item.id === 'all') {

        setSelectedTeamFilter(null)

      } else {

        setSelectedTeamFilter(item.id)

      }

      setSelectedCountryFilter(null)

      setSelectedTrainerFilter(null)

    } else if (activeTab === 'country') {

      if (item.id === 'all') {

        setSelectedCountryFilter(null)

    } else {

        setSelectedCountryFilter(item.name)

    }

      setSelectedTeamFilter(null)

      setSelectedTrainerFilter(null)

    } else {

      // trainers tab - set trainer filter

      if (item.id === 'all') {

        setSelectedTrainerFilter(null)

      } else {
    
        setSelectedTrainerFilter(item.name)

      }

      setSelectedTeamFilter(null)

      setSelectedCountryFilter(null)

    }

  }



  const handleSortSelect = (option: {id: string, label: string}) => {

    setSortBy(option.id as "xp" | "catches" | "distance" | "pokestops")

    setShowProxyDropdown(false)

  }



  // Profile preview handlers
  const handlePreviewClick = (e: React.MouseEvent, profileId: string | null | undefined) => {
    e.stopPropagation(); // Prevent row click
    
    // Don't allow clicking on aggregated data (no individual profile)
    if (!profileId) {
      return;
    }
    
    if (!trialStatus.canClickIntoProfiles) {
      navigate('/upgrade');
      return;
    }
    setSelectedProfile(profileId === selectedProfile ? null : profileId);
  };

  const handleClosePreview = () => {
    setSelectedProfile(null);
  };




  // Clear filters function

  const clearFilters = (newTab?: "trainers" | "country" | "team") => {
    const tabToUse = newTab || activeTab

    setSelectedTeamFilter(null)

    setSelectedCountryFilter(null)

    setSelectedTrainerFilter(null)

    // Update dynamic dropdown value based on tab

    if (tabToUse === 'trainers') {

      setSelectedDynamicValue('All Trainers')

    } else if (tabToUse === 'team') {

      setSelectedDynamicValue('All Teams')

    } else if (tabToUse === 'country') {

      setSelectedDynamicValue('All Country')

    }

  }



  // Update tab selection to clear filters

  const handleTabChange = (tab: "trainers" | "country" | "team") => {
    // Prevent any potential event bubbling issues
    console.log('Tab change triggered:', tab)
    
    // Immediately update the tab for instant UI feedback
    setActiveTab(tab)
    
    // Clear filters with the new tab
    clearFilters(tab)
    
    // The useEffect will handle data loading automatically
  }



  // Handle upgrade button click - redirect to upgrade page

  const handleUpgrade = () => {

    navigate('/upgrade')

  }



  // Helper functions for dynamic dropdown

  const getDynamicDropdownData = () => {

    if (activeTab === 'team') {

      return [{id: 'all', name: 'All Teams', color: '#000000'}, ...teams]

    } else if (activeTab === 'country') {

      return [{id: 'all', name: 'All Country', flag: 'https://flagcdn.com/w40/xx.png'}, 

              ...countries.map(country => ({id: country.code, name: country.name, flag: country.flag}))]

    } else {

      return [{id: 'all', name: 'All Trainers'}, ...trainers]

    }

  }






  const handleExport = async () => {
    try {
      setExporting(true)

      // Get the actual period dates from database
      const getPeriodInfo = async () => {
        if (timePeriod === 'alltime') {
          return {
            periodName: 'All Time',
            dateRange: 'ALL TIME',
            periodText: 'ALL TIME'
          }
        }

        try {
          // Check if we have completed period data first
          if (timePeriod === 'weekly') {
            const { data: completedWeekData, error: weekError } = await supabase.rpc('get_last_completed_week')
            if (!weekError && completedWeekData && completedWeekData.length > 0) {
              const { period_start, period_end } = completedWeekData[0]
              const startDate = new Date(period_start)
              const endDate = new Date(period_end)
              const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
              return {
                periodName: 'Week',
                dateRange: `${formatDate(startDate)} - ${formatDate(endDate)}`,
                periodText: `WEEK: ${formatDate(startDate)} - ${formatDate(endDate)}`
              }
            }
          } else if (timePeriod === 'monthly') {
            const { data: completedMonthData, error: monthError } = await supabase.rpc('get_last_completed_month')
            if (!monthError && completedMonthData && completedMonthData.length > 0) {
              const { period_start, period_end } = completedMonthData[0]
              const startDate = new Date(period_start)
              const endDate = new Date(period_end)
              const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
              return {
                periodName: 'Month',
                dateRange: `${formatDate(startDate)} - ${formatDate(endDate)}`,
                periodText: `MONTH: ${formatDate(startDate)} - ${formatDate(endDate)}`
              }
            }
          }
        } catch (error) {
          console.error('Error fetching period data:', error)
        }

        // Fallback to current period calculation
        if (timePeriod === 'weekly') {
          const now = new Date()
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 6)
          const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
          return {
            periodName: 'Week',
            dateRange: `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`,
            periodText: `CURRENT WEEK: ${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`
          }
        } else {
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
          return {
            periodName: 'Month',
            dateRange: `${formatDate(startOfMonth)} - ${formatDate(endOfMonth)}`,
            periodText: `CURRENT MONTH: ${formatDate(startOfMonth)} - ${formatDate(endOfMonth)}`
          }
        }
      }

      const periodInfo = await getPeriodInfo()

      console.log('Starting image export for:', periodInfo.periodName)

      // Create leaderboard data export (top 10 + user's position if not in top 10)
      const leaderboardData = processedData.slice(0, 10)
      
      // Find user's position if not in top 10
      const currentUser = processedData.find((player: any) => player.isCurrentUser)
      const userPosition = currentUser ? processedData.findIndex((player: any) => player.isCurrentUser) + 1 : null
      
      // Create canvas for the card - using exact dimensions from CSS
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Canvas context not available')
      }
      
      // Set canvas size to match CSS specifications (958x1831)
      const scale = 0.6 // Scale down for reasonable file size
      canvas.width = 958 * scale
      canvas.height = 1831 * scale
      ctx.scale(scale, scale)
      
      // Gray background
      ctx.fillStyle = '#f5f5f5'
      ctx.fillRect(0, 0, 958, 1831)
      
      // Main card background with rounded corners and shadow
      const cardX = 0
      const cardY = 0
      const cardWidth = 958
      const cardHeight = 1831
      const cornerRadius = 19.35
      
      // Draw card shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 5.8
      ctx.shadowOffsetY = 0
      
      // Draw rounded rectangle background
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.moveTo(cardX + cornerRadius, cardY)
      ctx.lineTo(cardX + cardWidth - cornerRadius, cardY)
      ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + cornerRadius)
      ctx.lineTo(cardX + cardWidth, cardY + cardHeight - cornerRadius)
      ctx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight, cardX + cardWidth - cornerRadius, cardY + cardHeight)
      ctx.lineTo(cardX + cornerRadius, cardY + cardHeight)
      ctx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - cornerRadius)
      ctx.lineTo(cardX, cardY + cornerRadius)
      ctx.quadraticCurveTo(cardX, cardY, cardX + cornerRadius, cardY)
      ctx.closePath()
      ctx.fill()
      
      // Reset shadow for other elements
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      
      // Load PlayerZERO logo image first
      let logoImg = null
      try {
        logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => resolve(img)
          img.onerror = () => reject(new Error('Failed to load layer_1.png'))
          img.src = '/images/Layer_1.png'
        })
        
      } catch (error) {
        console.warn('Failed to load PlayerZero logo, using text fallback:', error)
        logoImg = null
      }
      
      // Draw PlayerZERO logo or fallback text and calculate header height
      let headerBottomY = 120 // Default bottom position after text
      
      if (logoImg) {
        // Calculate logo dimensions and position
        const logoMaxWidth = 300 // Max width for logo
        const logoMaxHeight = 60 // Max height for logo
        
        // Calculate scaled dimensions maintaining aspect ratio
        const logoAspectRatio = logoImg.naturalWidth / logoImg.naturalHeight
        let logoWidth = logoMaxWidth
        let logoHeight = logoMaxWidth / logoAspectRatio
        
        if (logoHeight > logoMaxHeight) {
          logoHeight = logoMaxHeight
          logoWidth = logoMaxHeight * logoAspectRatio
        }
        
        // Center the logo horizontally
        const logoX = (958 - logoWidth) / 2
        const logoY = 40 // Position from top (moved up slightly)
        
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight)
        console.log(`Successfully loaded PlayerZero logo: ${logoWidth}x${logoHeight}`)
        
        // Calculate where the logo ends plus some padding
        headerBottomY = logoY + logoHeight + 20 // 20px padding after logo
      } else {
        // Fallback: Use text if image fails to load
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 36px Poppins'
        ctx.textAlign = 'center'
        ctx.fillText('PlayerZERO', 958/2, 80)
        headerBottomY = 120 // Standard text position + padding
      }
      
      // TOP 10 title - positioned relative to header bottom
      const top10Y = headerBottomY + 40
      ctx.fillStyle = '#DC2627'
      ctx.font = '900 50px Poppins'
      ctx.textAlign = 'center'
      ctx.fillText('TOP 10', 958/2, top10Y)
      
      // LOCKED LEADERBOARD title - positioned relative to TOP 10
      const lockedTitleY = top10Y + 80
      ctx.fillStyle = '#000000'
      ctx.font = '800 67px Poppins'
      ctx.fillText('LOCKED LEADERBOARD', 958/2, lockedTitleY)
      
      // Date range - positioned relative to LOCKED LEADERBOARD
      const dateRangeY = lockedTitleY + 60
      ctx.fillStyle = '#DC2627'
      ctx.font = '600 40px Poppins'
      ctx.fillText(periodInfo.periodText, 958/2, dateRangeY)
      
      // Stat type (196x60) - positioned relative to date range
      const statTypeY = dateRangeY + 60
      ctx.fillStyle = '#000000'
      ctx.font = '900 40px Poppins'
      ctx.fillText(getStatLabel().toUpperCase(), 958/2, statTypeY)
      
      
      // Top 3 medal cards section (831.6x323.63) - positioned relative to stat type
      const medalSectionY = statTypeY + 80
      const medalSpacing = 24
      
      // Medal card specifications from CSS with exact dimensions
      const medalConfigs = [
        {
          // 1st place - center, larger card (272.42x323.63)
          width: 272.42,
          height: 323.63,
          background: 'linear-gradient(188.19deg, #A66300 6.29%, #FFBF00 115.32%)',
          borderColor: '#FFBF00',
          position: 'center',
          order: 0
        },
        {
          // 2nd place - left, smaller card (260.13x301.1)
          width: 260.13,
          height: 301.1,
          background: 'linear-gradient(180deg, #202020 0%, #545454 100%)',
          borderColor: '#A4A4A4',
          position: 'left',
          order: 1
        },
        {
          // 3rd place - right, smaller card (260.13x301.1)
          width: 260.13,
          height: 301.1,
          background: 'linear-gradient(350.79deg, #9E3F00 30.43%, #261404 93.02%)',
          borderColor: '#C9490E',
          position: 'right',
          order: 2
        }
      ]
      
      // Calculate positions: 1st center, 2nd left, 3rd right
      const centerX = 958 / 2
      const firstCardX = centerX - medalConfigs[0].width / 2 // 1st place center
      const secondCardX = firstCardX - medalConfigs[1].width - medalSpacing // 2nd place left
      const thirdCardX = firstCardX + medalConfigs[0].width + medalSpacing // 3rd place right
      
      const medalPositions = [firstCardX, secondCardX, thirdCardX]
      
      // Enhanced image loading function with retry mechanism
      const loadImage = (imagePath: string, maxRetries: number = 2): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          let attempts = 0
          
          const attemptLoad = () => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            
            img.onload = () => {
              resolve(img)
            }
            
            img.onerror = () => {
              attempts++
              if (attempts <= maxRetries) {
                console.warn(`Failed to load ${imagePath}, attempt ${attempts}/${maxRetries + 1}`)
                // Retry after a short delay
                setTimeout(() => attemptLoad(), 500 * attempts)
              } else {
                console.error(`Failed to load ${imagePath} after ${maxRetries + 1} attempts`)
                reject(new Error(`Failed to load ${imagePath} after ${maxRetries + 1} attempts`))
              }
            }
            
            img.src = imagePath
          }
          
          attemptLoad()
        })
      }
      
      // Keep the old function name for medal images
      const loadMedalImage = loadImage
      
      // Load all medal images first
      const medalImagePaths = [
        '/images/1st_position.png',
        '/images/2nd_postion.png',  // Note: keeping the original typo in filename
        '/images/3rd_psotion.png'   // Note: keeping the original typo in filename
      ]
      
      const medalImages: (HTMLImageElement | null)[] = []
      
      // Load images for the positions we have data for
      for (let i = 0; i < Math.min(3, leaderboardData.length); i++) {
        try {
          const img = await loadMedalImage(medalImagePaths[i])
          medalImages[i] = img
        } catch (error) {
          console.error(`Failed to load medal image ${i + 1}:`, error)
          medalImages[i] = null // Will use fallback
        }
      }
      
      // Load country flag images for all positions we'll show (up to 10)
      const flagImages: (HTMLImageElement | null)[] = []
      const maxPositions = Math.min(10, leaderboardData.length)
      
      for (let i = 0; i < maxPositions; i++) {
        const player = leaderboardData[i]
        
        // Enhanced flag loading with multiple fallback attempts
        if (player.countryName) {
          try {
            // First try the provided flag URL if available
            let flagImg = null
            if (player.countryFlag) {
              try {
                flagImg = await loadImage(player.countryFlag, 1)
                console.log(`Successfully loaded primary flag for ${player.name} (${player.countryName})`)
              } catch (primaryError) {
                console.warn(`Primary flag failed for ${player.name} (${player.countryName}): ${primaryError instanceof Error ? primaryError.message : String(primaryError)}`)
              }
            }
            
            // If primary failed or no URL provided, try enhanced mapping
            if (!flagImg) {
              const fallbackFlagUrl = getCountryFlagUrl(player.countryName)
              if (fallbackFlagUrl && fallbackFlagUrl !== 'https://flagcdn.com/w40/xx.png') {
                try {
                  flagImg = await loadImage(fallbackFlagUrl, 2) // More retries for fallback
                  console.log(`Fallback flag loaded for ${player.name} (${player.countryName}): ${fallbackFlagUrl}`)
                } catch (fallbackError) {
                  console.warn(`Fallback flag failed for ${player.name} (${player.countryName}): ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`)
                }
              }
            }
            
            flagImages[i] = flagImg
            
            if (!flagImg) {
              console.error(`All flag loading methods failed for ${player.name} (${player.countryName})`)
            }
            
          } catch (error) {
            console.error(`Unexpected error loading flag for ${player.name}:`, error)
            flagImages[i] = null
          }
        } else {
          flagImages[i] = null
          console.warn(`Player ${player.name} has no country name`)
        }
      }
      
      // Get trainer levels for the top players
      const playerLevels: { [key: string]: number } = {}
      try {
        // Fetch trainer levels from profiles table for the players we're showing
        const profileIds = leaderboardData.slice(0, Math.min(10, leaderboardData.length))
          .filter(p => p.profileId)
          .map(p => p.profileId)
        
        // Also include current user if not in top 10
        if (currentUser?.profileId && !profileIds.includes(currentUser.profileId)) {
          profileIds.push(currentUser.profileId)
        }
        
        if (profileIds.length > 0) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('id, trainer_level')
            .in('id', profileIds)
          
          if (profileData && !error) {
            profileData.forEach(profile => {
              playerLevels[profile.id] = profile.trainer_level || 1
            })
          }
        }
      } catch (error) {
        console.warn('Failed to fetch trainer levels:', error)
      }
      
      // Load user's country flag if they have one and are not in top 10
      let userFlagImage: HTMLImageElement | null = null
      const currentUserInTop10 = leaderboardData.slice(0, 10).some(p => p.profileId === currentUser?.profileId)
      if (currentUser?.countryFlag && !currentUserInTop10) {
        try {
          // First try the provided flag URL
          userFlagImage = await loadImage(currentUser.countryFlag, 1)
          console.log(`Successfully loaded user flag (${currentUser.countryName || 'Unknown'})`)
        } catch (error) {
          console.warn(`Primary user flag failed, trying fallback...`)
          
          // Try to generate a new flag URL if we have country name
          if (currentUser.countryName) {
            try {
              const fallbackFlagUrl = getCountryFlagUrl(currentUser.countryName)
              if (fallbackFlagUrl && fallbackFlagUrl !== currentUser.countryFlag) {
                userFlagImage = await loadImage(fallbackFlagUrl, 1)
                console.log(`Fallback user flag loaded (${currentUser.countryName})`)
              } else {
                userFlagImage = null
              }
            } catch (fallbackError) {
              console.warn(`All user flag loading attempts failed`)
              userFlagImage = null
            }
          } else {
            userFlagImage = null
          }
        }
      }
      
      // Draw top 3 cards in the correct order (1st, 2nd, 3rd)
      for (let index = 0; index < Math.min(3, leaderboardData.length); index++) {
        const player = leaderboardData[index]
        const config = medalConfigs[index]
        const medalX = medalPositions[index]
        const medalWidth = config.width
        const medalHeight = config.height
        
        // Adjust Y position for 2nd and 3rd place to align bottoms (since they're shorter)
        const cardY = index === 0 ? medalSectionY : medalSectionY + (medalConfigs[0].height - medalHeight)
        
        // Draw card background with gradient effect and opacity
        const gradientColors = [
          ['#FFBF00', '#A66300'], // Gold
          ['#545454', '#202020'], // Silver
          ['#261404', '#9E3F00']  // Bronze
        ]
        
        const gradient = ctx.createLinearGradient(medalX, cardY, medalX, cardY + medalHeight)
        gradient.addColorStop(0, gradientColors[index][0])
        gradient.addColorStop(1, gradientColors[index][1])
        
        // Set opacity to 0.8 as per CSS
        ctx.globalAlpha = 0.8
        ctx.fillStyle = gradient
        
        // Draw rounded rectangle background (border-radius: 9.02787px)
        const borderRadius = 9.03
        ctx.beginPath()
        ctx.moveTo(medalX + borderRadius, cardY)
        ctx.lineTo(medalX + medalWidth - borderRadius, cardY)
        ctx.quadraticCurveTo(medalX + medalWidth, cardY, medalX + medalWidth, cardY + borderRadius)
        ctx.lineTo(medalX + medalWidth, cardY + medalHeight - borderRadius)
        ctx.quadraticCurveTo(medalX + medalWidth, cardY + medalHeight, medalX + medalWidth - borderRadius, cardY + medalHeight)
        ctx.lineTo(medalX + borderRadius, cardY + medalHeight)
        ctx.quadraticCurveTo(medalX, cardY + medalHeight, medalX, cardY + medalHeight - borderRadius)
        ctx.lineTo(medalX, cardY + borderRadius)
        ctx.quadraticCurveTo(medalX, cardY, medalX + borderRadius, cardY)
        ctx.closePath()
        ctx.fill()
        
        // Draw border (3.07242px solid)
        ctx.strokeStyle = config.borderColor
        ctx.lineWidth = 3.07
        ctx.stroke()
        
        // Add box shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
        ctx.shadowBlur = 4.1
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4.1
        ctx.stroke()
        
        // Reset shadow and opacity
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.globalAlpha = 1.0
        
        // Draw inner frame (Frame 723) with exact dimensions
        const innerPadding = 9.03
        const innerX = medalX + innerPadding
        const innerY = cardY + innerPadding
        const innerWidth = (index === 0 ? 253.99 : 244.77) // Different inner widths per CSS
        const innerHeight = (index === 0 ? 305.19 : 286.76) // Different inner heights per CSS
        
        // Inner frame border (1.02414px solid)
        ctx.strokeStyle = config.borderColor
        ctx.lineWidth = 1.02
        
        // Draw inner rounded rectangle (border-radius: 6.14484px)
        const innerRadius = 6.14
      ctx.beginPath()
        ctx.moveTo(innerX + innerRadius, innerY)
        ctx.lineTo(innerX + innerWidth - innerRadius, innerY)
        ctx.quadraticCurveTo(innerX + innerWidth, innerY, innerX + innerWidth, innerY + innerRadius)
        ctx.lineTo(innerX + innerWidth, innerY + innerHeight - innerRadius)
        ctx.quadraticCurveTo(innerX + innerWidth, innerY + innerHeight, innerX + innerWidth - innerRadius, innerY + innerHeight)
        ctx.lineTo(innerX + innerRadius, innerY + innerHeight)
        ctx.quadraticCurveTo(innerX, innerY + innerHeight, innerX, innerY + innerHeight - innerRadius)
        ctx.lineTo(innerX, innerY + innerRadius)
        ctx.quadraticCurveTo(innerX, innerY, innerX + innerRadius, innerY)
        ctx.closePath()
        ctx.stroke()
        
        // Add inner frame drop shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
        ctx.shadowBlur = 4.1
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4.1
      ctx.stroke()
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        
        // Medal icon area (107.56x107.56) - exact SVG dimensions
        const medalIconSize = 107.56
        const medalIconY = cardY + 30 // Position within card
        const centerX = medalX + medalWidth/2
        const centerY = medalIconY + medalIconSize/2
        
        // Draw medal image if loaded, otherwise use fallback
        const medalImg = medalImages[index]
        
        if (medalImg) {
          // Use the loaded medal image
          ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
          ctx.shadowBlur = 4.1
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 4.1
          
          // Draw the medal image centered
          const imageSize = medalIconSize
          const imageX = centerX - imageSize/2
          const imageY = centerY - imageSize/2
          
          ctx.drawImage(medalImg, imageX, imageY, imageSize, imageSize)
          
          // Reset shadow
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
          
        } else {
          // Fallback: draw simple medal design if image failed to load
          console.warn(`Using fallback design for position ${index + 1}`)
          
          const medalBgColors = [
            'rgba(194, 139, 0, 0.3)',   // Gold
            'rgba(208, 208, 208, 0.13)', // Silver
            'rgba(171, 54, 0, 0.3)'      // Bronze
          ]
          
          const medalBorderColors = [
            '#F6B81C', // Gold
            '#787878', // Silver
            '#C9490E'  // Bronze
          ]
          
          ctx.fillStyle = medalBgColors[index]
          ctx.beginPath()
          ctx.arc(centerX, centerY, medalIconSize/2, 0, 2 * Math.PI)
          ctx.fill()
          
          ctx.strokeStyle = medalBorderColors[index]
          ctx.lineWidth = 2.05
      ctx.beginPath()
          ctx.arc(centerX, centerY, medalIconSize/2, 0, 2 * Math.PI)
          ctx.stroke()
          
          // Add shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
          ctx.shadowBlur = 4.1
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 4.1
      ctx.stroke()

          // Reset shadow
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
          
          // Draw number
          ctx.fillStyle = medalBorderColors[index]
          ctx.font = 'bold 24px Poppins'
          ctx.textAlign = 'center'
          ctx.fillText((index + 1).toString(), centerX, centerY + 8)
        }
        
        // Player name (207x34) - exact CSS specs
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '900 22.53px Poppins' // font-size: 22.5311px
        ctx.textAlign = 'center'
        const name = player.name.length > 12 ? player.name.substring(0, 12) + '...' : player.name
        ctx.fillText(name, medalX + medalWidth/2, cardY + config.height - 120)
        
        // Country and Team in one row - using exact CSS specifications
        const infoRowY = cardY + config.height - 80
        const containerWidth = 209.95
        const containerX = medalX + (medalWidth - containerWidth) / 2 // Center the container
        
        // Country section (Frame 22) - width: 86.72px, height: 18px
        const countryFrameX = containerX
        
        // Country flag (Frame 651) - 24.58x16.39px with drop-shadow and border-radius
        const flagImg = flagImages[index]
        const flagWidth = 24.58
        const flagHeight = 16.39
        const flagX = countryFrameX
        const flagY = infoRowY - flagHeight/2
        
        if (flagImg) {
          // Add drop shadow: drop-shadow(0px 4.09656px 4.09656px rgba(0, 0, 0, 0.25))
          ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
          ctx.shadowBlur = 4.09656
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 4.09656
          
          // Draw flag with border-radius (simulated with rounded rectangle)
          ctx.save()
          ctx.beginPath()
          const radius = 2.04828
          
          // Create rounded rectangle path (fallback for browsers without roundRect)
          if (ctx.roundRect) {
            ctx.roundRect(flagX, flagY, flagWidth, flagHeight, radius)
          } else {
            // Manual rounded rectangle implementation
            ctx.moveTo(flagX + radius, flagY)
            ctx.lineTo(flagX + flagWidth - radius, flagY)
            ctx.quadraticCurveTo(flagX + flagWidth, flagY, flagX + flagWidth, flagY + radius)
            ctx.lineTo(flagX + flagWidth, flagY + flagHeight - radius)
            ctx.quadraticCurveTo(flagX + flagWidth, flagY + flagHeight, flagX + flagWidth - radius, flagY + flagHeight)
            ctx.lineTo(flagX + radius, flagY + flagHeight)
            ctx.quadraticCurveTo(flagX, flagY + flagHeight, flagX, flagY + flagHeight - radius)
            ctx.lineTo(flagX, flagY + radius)
            ctx.quadraticCurveTo(flagX, flagY, flagX + radius, flagY)
          }
          
          ctx.clip()
          ctx.drawImage(flagImg, flagX, flagY, flagWidth, flagHeight)
          ctx.restore()
          
          // Reset shadow
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
        } else {
          // Fallback: Draw a placeholder flag rectangle when no flag image is available
          ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
          ctx.shadowBlur = 4.09656
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 4.09656
          
          // Draw placeholder rectangle with border
          ctx.fillStyle = '#CCCCCC' // Light gray background
          ctx.strokeStyle = '#999999' // Darker gray border
          ctx.lineWidth = 1
          
          ctx.save()
          ctx.beginPath()
          const radius = 2.04828
          
          if (ctx.roundRect) {
            ctx.roundRect(flagX, flagY, flagWidth, flagHeight, radius)
          } else {
            // Manual rounded rectangle for placeholder
            ctx.moveTo(flagX + radius, flagY)
            ctx.lineTo(flagX + flagWidth - radius, flagY)
            ctx.quadraticCurveTo(flagX + flagWidth, flagY, flagX + flagWidth, flagY + radius)
            ctx.lineTo(flagX + flagWidth, flagY + flagHeight - radius)
            ctx.quadraticCurveTo(flagX + flagWidth, flagY + flagHeight, flagX + flagWidth - radius, flagY + flagHeight)
            ctx.lineTo(flagX + radius, flagY + flagHeight)
            ctx.quadraticCurveTo(flagX, flagY + flagHeight, flagX, flagY + flagHeight - radius)
            ctx.lineTo(flagX, flagY + radius)
            ctx.quadraticCurveTo(flagX, flagY, flagX + radius, flagY)
          }
          
          ctx.fill()
          ctx.stroke()
          ctx.restore()
          
          // Draw "?" in the center of placeholder
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
          
          ctx.fillStyle = '#666666'
          ctx.font = 'bold 10px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('?', flagX + flagWidth/2, flagY + flagHeight/2)
          
          // Reset text alignment
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
        }
        
        // Country text - gap: 6.14px, font: 500 12.2897px Poppins
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '500 12.2897px Poppins'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        const countryText = player.countryName || 'Unknown'
        const countryTextX = flagX + flagWidth + 6.14
        const countryTextY = infoRowY // Center vertically at infoRowY
        ctx.fillText(countryText.length > 8 ? countryText.substring(0, 8) + '...' : countryText, countryTextX, countryTextY)
        
        // Team section (Frame 584) - width: 88.53px, height: 18px with drop-shadow
        const teamFrameX = containerX + containerWidth - 88.53
        
        // Team circle (Ellipse 3) - 16.58x16.58px with border: 1.50494px solid #FFFFFF
        const teamColorHex = player.team || '#FF0001' // Default to red as in CSS
        const circleSize = 16.58
        const circleX = teamFrameX + circleSize/2
        const circleY = infoRowY
        
        // Add drop shadow for team section: drop-shadow(0px 6.01975px 6.01975px rgba(0, 0, 0, 0.25))
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
        ctx.shadowBlur = 6.01975
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 6.01975
        
        // Team circle fill
        ctx.fillStyle = teamColorHex
        ctx.beginPath()
        ctx.arc(circleX, circleY, circleSize/2, 0, 2 * Math.PI)
        ctx.fill()
        
        // Team circle border
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 1.50494
        ctx.beginPath()
        ctx.arc(circleX, circleY, (circleSize - 1.50494)/2, 0, 2 * Math.PI)
        ctx.stroke()
        
        // Reset shadow
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        
        // Team text - gap: 9.95px, font: 400 12.2897px Poppins
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '400 12.2897px Poppins'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        const teamName = player.teamColor ? 
          (player.teamColor.charAt(0).toUpperCase() + player.teamColor.slice(1) + ' Team') : 
          'Red Team'
        const teamTextX = circleX + circleSize/2 + 9.95
        const teamTextY = infoRowY // Center vertically at infoRowY
        ctx.fillText(teamName, teamTextX, teamTextY)
        
        // Reset text alignment for other elements
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        
        // Divider line (removed trainer level from top 3)
        ctx.strokeStyle = config.borderColor
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(medalX + 20, cardY + config.height - 50)
        ctx.lineTo(medalX + medalWidth - 20, cardY + config.height - 50)
        ctx.stroke()
        
        // Stat value (73x20)
        const statValue = typeof player.statValue === 'number' ? formatNumber(player.statValue) : player.statValue
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '600 13px Poppins'
        ctx.textAlign = 'center'
        ctx.fillText(statValue, medalX + medalWidth/2, cardY + config.height - 25)
        
        // Stat label (45x17)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)'
        ctx.font = '400 11px Poppins'
        ctx.fillText(getStatLabel(), medalX + medalWidth/2, cardY + config.height - 10)
      }
      
      // Positions 4-10 list - using exact CSS specifications
      const listStartY = medalSectionY + medalConfigs[0].height + 60
      const rowHeight = 90.7 + 12.49 // Frame height + gap from CSS
      
      leaderboardData.slice(3, 10).forEach((player: any, index: number) => {
        const actualIndex = index + 4 // Positions 4-10 (index 0-6 becomes positions 4-10)
        const rowY = listStartY + (index * rowHeight)
        
        // Row background (849.01x90.7)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        const rowBg = {
          x: 50,
          y: rowY,
          width: 849,
          height: 90,
          radius: 22
        }
        
        // Draw rounded rectangle for row
        ctx.beginPath()
        ctx.moveTo(rowBg.x + rowBg.radius, rowBg.y)
        ctx.lineTo(rowBg.x + rowBg.width - rowBg.radius, rowBg.y)
        ctx.quadraticCurveTo(rowBg.x + rowBg.width, rowBg.y, rowBg.x + rowBg.width, rowBg.y + rowBg.radius)
        ctx.lineTo(rowBg.x + rowBg.width, rowBg.y + rowBg.height - rowBg.radius)
        ctx.quadraticCurveTo(rowBg.x + rowBg.width, rowBg.y + rowBg.height, rowBg.x + rowBg.width - rowBg.radius, rowBg.y + rowBg.height)
        ctx.lineTo(rowBg.x + rowBg.radius, rowBg.y + rowBg.height)
        ctx.quadraticCurveTo(rowBg.x, rowBg.y + rowBg.height, rowBg.x, rowBg.y + rowBg.height - rowBg.radius)
        ctx.lineTo(rowBg.x, rowBg.y + rowBg.radius)
        ctx.quadraticCurveTo(rowBg.x, rowBg.y, rowBg.x + rowBg.radius, rowBg.y)
        ctx.closePath()
        ctx.fill()
        
        // Row shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
        ctx.shadowBlur = 48
        ctx.shadowOffsetX = -4
        ctx.shadowOffsetY = 22
        ctx.fill()
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        
        // Rank number (27.53x75) - font: 700 49.9525px Poppins, line-height: 75px
        ctx.fillStyle = '#000000'
        ctx.font = '700 49.9525px Poppins'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        const containerX = (958 - 849.01) / 2 // Center container
        ctx.fillText(actualIndex.toString(), containerX + 29.9715, rowY + 90.7/2)
        
        // Player name (248x37) - font: 600 24.9762px Poppins, line-height: 37px
        ctx.fillStyle = '#000000'
        ctx.font = '600 24.9762px Poppins'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        const name = player.name.length > 20 ? player.name.substring(0, 20) + '...' : player.name
        const cardX = containerX + 29.9715 + 27.53 + 34.13 + 27.4739 // Container padding + rank width + gap + card padding
        ctx.fillText(name, cardX, rowY + 9.15796)
        
        // Team section - positioned in second row (gap: 3.87px from player name)
        const secondRowY = rowY + 9.15796 + 37 + 3.87
        
        // Team circle (18.99x18.99) with border: 4.16271px solid #FFFFFF
        const teamColorHex = player.team || '#DC2627'
        const circleRadius = 18.99 / 2
        const circleX = cardX + circleRadius
        const circleY = secondRowY + 28/2
        
        ctx.fillStyle = teamColorHex
        ctx.beginPath()
        ctx.arc(circleX, circleY, circleRadius, 0, 2 * Math.PI)
        ctx.fill()
        
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 4.16271
        ctx.beginPath()
        ctx.arc(circleX, circleY, circleRadius - 4.16271/2, 0, 2 * Math.PI)
        ctx.stroke()
        
        // Team name (96x28) - font: 400 18.991px Poppins, gap: 11.39px
        const teamName = player.teamColor ? 
          (player.teamColor.charAt(0).toUpperCase() + player.teamColor.slice(1) + ' Team') : 
          'Red Team'
        ctx.fillStyle = '#000000'
        ctx.font = '400 18.991px Poppins'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(teamName, circleX + circleRadius + 11.39, circleY)
        
        // Country flag (34.83x23.22) - using real country data
        const flagImg = flagImages[index + 3] // Use original array index (index + 3 for positions 4-10)
        if (flagImg) {
          const flagWidth = 30
          const flagHeight = 20
          const flagX = 340
          const flagY = rowY + 55
          ctx.drawImage(flagImg, flagX, flagY, flagWidth, flagHeight)
        } else {
          // Fallback to text if flag image not available
          ctx.fillStyle = '#000000'
          ctx.font = '400 19px Poppins'
          ctx.fillText('🏳️', 350, rowY + 70)
        }
        
        // Level - using real trainer level data
        ctx.fillStyle = '#000000'
        ctx.font = '500 19px Poppins'
        const playerLevel = player.profileId ? (playerLevels[player.profileId] || '--') : '--'
        ctx.fillText(`lvl ${playerLevel}`, 400, rowY + 70)
        
        // Stat value (122x34)
        ctx.fillStyle = '#000000'
        ctx.font = '600 23px Poppins'
        ctx.textAlign = 'right'
        const statValue = typeof player.statValue === 'number' ? formatNumber(player.statValue) : player.statValue
        ctx.fillText(statValue, 850, rowY + 45)
        
        // Stat label (131.04x28)
        ctx.fillStyle = '#353535'
        ctx.font = '400 19px Poppins'
        ctx.fillText(getStatLabel(), 850, rowY + 70)
      })
      
      // User's position (if not in top 10)
      if (userPosition && userPosition > 10 && currentUser) {
        const userRowY = listStartY + (7 * rowHeight) + 40
        
        // Highlighted background with border
        ctx.fillStyle = 'rgba(173, 173, 173, 0.16)'
        ctx.strokeStyle = '#848282'
        ctx.lineWidth = 1
        
        const userBg = {
          x: 50,
          y: userRowY,
          width: 849,
          height: 97,
          radius: 10
        }
        
        // Draw rounded rectangle
      ctx.beginPath()
        ctx.moveTo(userBg.x + userBg.radius, userBg.y)
        ctx.lineTo(userBg.x + userBg.width - userBg.radius, userBg.y)
        ctx.quadraticCurveTo(userBg.x + userBg.width, userBg.y, userBg.x + userBg.width, userBg.y + userBg.radius)
        ctx.lineTo(userBg.x + userBg.width, userBg.y + userBg.height - userBg.radius)
        ctx.quadraticCurveTo(userBg.x + userBg.width, userBg.y + userBg.height, userBg.x + userBg.width - userBg.radius, userBg.y + userBg.height)
        ctx.lineTo(userBg.x + userBg.radius, userBg.y + userBg.height)
        ctx.quadraticCurveTo(userBg.x, userBg.y + userBg.height, userBg.x, userBg.y + userBg.height - userBg.radius)
        ctx.lineTo(userBg.x, userBg.y + userBg.radius)
        ctx.quadraticCurveTo(userBg.x, userBg.y, userBg.x + userBg.radius, userBg.y)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        
        // Inner content background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.77)'
        const innerBg = {
          x: 70,
          y: userRowY + 10,
          width: 710,
          height: 81,
          radius: 22
        }

      ctx.beginPath()
        ctx.moveTo(innerBg.x + innerBg.radius, innerBg.y)
        ctx.lineTo(innerBg.x + innerBg.width - innerBg.radius, innerBg.y)
        ctx.quadraticCurveTo(innerBg.x + innerBg.width, innerBg.y, innerBg.x + innerBg.width, innerBg.y + innerBg.radius)
        ctx.lineTo(innerBg.x + innerBg.width, innerBg.y + innerBg.height - innerBg.radius)
        ctx.quadraticCurveTo(innerBg.x + innerBg.width, innerBg.y + innerBg.height, innerBg.x + innerBg.width - innerBg.radius, innerBg.y + innerBg.height)
        ctx.lineTo(innerBg.x + innerBg.radius, innerBg.y + innerBg.height)
        ctx.quadraticCurveTo(innerBg.x, innerBg.y + innerBg.height, innerBg.x, innerBg.y + innerBg.height - innerBg.radius)
        ctx.lineTo(innerBg.x, innerBg.y + innerBg.radius)
        ctx.quadraticCurveTo(innerBg.x, innerBg.y, innerBg.x + innerBg.radius, innerBg.y)
        ctx.closePath()
        ctx.fill()
        
        // User rank (59x75)
        ctx.fillStyle = '#000000'
        ctx.font = '700 50px Poppins'
        ctx.textAlign = 'left'
        ctx.fillText(userPosition.toString(), 100, userRowY + 55)
        
        // User name
        ctx.fillStyle = '#000000'
        ctx.font = '600 25px Poppins'
        const userName = currentUser.name.length > 20 ? currentUser.name.substring(0, 20) + '...' : currentUser.name
        ctx.fillText(userName, 170, userRowY + 40)
        
        // Team and country info - using real user team color
        const userTeamColorHex = currentUser.team || '#DC2627'
        ctx.fillStyle = userTeamColorHex
        ctx.beginPath()
        ctx.arc(180, userRowY + 65, 9, 0, 2 * Math.PI)
        ctx.fill()
        
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(180, userRowY + 65, 9, 0, 2 * Math.PI)
      ctx.stroke()

        // Team and country info - using real user data
        ctx.fillStyle = '#000000'
        ctx.font = '400 19px Poppins'
        const userTeamName = currentUser.teamColor ? 
          (currentUser.teamColor.charAt(0).toUpperCase() + currentUser.teamColor.slice(1) + ' Team') : 
          'Team'
        ctx.fillText(userTeamName, 205, userRowY + 70)
        
        // User country flag - using preloaded image
        if (userFlagImage) {
          const flagWidth = 30
          const flagHeight = 20
          const flagX = 340
          const flagY = userRowY + 55
          ctx.drawImage(userFlagImage, flagX, flagY, flagWidth, flagHeight)
        } else {
          // Fallback to emoji if flag image not available
          ctx.fillStyle = '#000000'
          ctx.font = '400 19px Poppins'
          ctx.fillText('🏳️', 350, userRowY + 70)
        }
        
        ctx.font = '500 19px Poppins'
        const userLevel = currentUser.profileId ? (playerLevels[currentUser.profileId] || '--') : '--'
        ctx.fillText(`lvl ${userLevel}`, 400, userRowY + 70)
        
        // User stat value
        ctx.fillStyle = '#000000'
        ctx.font = '600 23px Poppins'
        ctx.textAlign = 'right'
        const userStatValue = typeof currentUser.statValue === 'number' ? formatNumber(currentUser.statValue) : currentUser.statValue
        ctx.fillText(userStatValue, 850, userRowY + 45)
        
        ctx.fillStyle = '#353535'
        ctx.font = '400 19px Poppins'
        ctx.fillText(getStatLabel(), 850, userRowY + 70)
      }
      
      // Footer (432x27)
      ctx.fillStyle = '#848282'
      ctx.font = '400 20px Geist'
      ctx.textAlign = 'center'
      ctx.fillText('Generated from PlayerZero App • Keep grinding!', 958/2, 1800)

      // Convert canvas to image and download
      const dataUrl = canvas.toDataURL('image/png', 1.0)

      // Create download link
      const link = document.createElement('a')
      const fileName = `PlayerZero-${periodInfo.periodName}-Leaderboard-${new Date().toISOString().split('T')[0]}.png`
      link.download = fileName
      link.href = dataUrl

      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log('Leaderboard image exported successfully:', fileName)
    } catch (error) {
      console.error('Failed to export leaderboard image:', error)
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



  // Enhanced country name normalization function
  const normalizeCountryName = (countryName: string): string => {
    if (!countryName) return ''
    
    return countryName
      .toLowerCase() // Convert to lowercase
      .trim() // Remove leading/trailing spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/-+/g, ' ') // Replace hyphens with spaces
      .replace(/\b(the|republic|of|and)\b/g, '') // Remove common words
      .replace(/\s+/g, ' ') // Clean up spaces again
      .trim() // Final trim
  }

  const getCountryFlagUrl = (countryName: string) => {
    // Enhanced country mapping with more variations and common misspellings
    const countryToCode: { [key: string]: string } = {
      // United States variations
      'united states': 'us', 'usa': 'us', 'us': 'us', 'america': 'us', 'united states america': 'us',
      
      // Canada variations  
      'canada': 'ca', 'can': 'ca',
      
      // United Kingdom variations
      'united kingdom': 'gb', 'uk': 'gb', 'england': 'gb', 'britain': 'gb', 'great britain': 'gb',
      'scotland': 'gb', 'wales': 'gb', 'northern ireland': 'gb',
      
      // European countries
      'australia': 'au', 'aus': 'au',
      'germany': 'de', 'deutschland': 'de', 'ger': 'de',
      'france': 'fr', 'fra': 'fr',
      'spain': 'es', 'españa': 'es', 'esp': 'es',
      'italy': 'it', 'italia': 'it', 'ita': 'it',
      'netherlands': 'nl', 'holland': 'nl', 'nederland': 'nl', 'nld': 'nl',
      'sweden': 'se', 'sverige': 'se', 'swe': 'se',
      'norway': 'no', 'norge': 'no', 'nor': 'no',
      'denmark': 'dk', 'danmark': 'dk', 'dnk': 'dk',
      'finland': 'fi', 'suomi': 'fi', 'fin': 'fi',
      'switzerland': 'ch', 'schweiz': 'ch', 'che': 'ch',
      'austria': 'at', 'österreich': 'at', 'aut': 'at',
      'belgium': 'be', 'belgië': 'be', 'belgique': 'be', 'bel': 'be',
      'portugal': 'pt', 'por': 'pt',
      'poland': 'pl', 'polska': 'pl', 'pol': 'pl',
      'czech republic': 'cz', 'czechia': 'cz', 'česká republika': 'cz', 'cze': 'cz',
      'hungary': 'hu', 'magyarország': 'hu', 'hun': 'hu',
      'romania': 'ro', 'românia': 'ro', 'rou': 'ro',
      'ukraine': 'ua', 'україна': 'ua', 'ukr': 'ua',
      'croatia': 'hr', 'hrvatska': 'hr', 'hrv': 'hr',
      'serbia': 'rs', 'srbija': 'rs', 'srb': 'rs',
      'greece': 'gr', 'ελλάδα': 'gr', 'grc': 'gr',
      'turkey': 'tr', 'türkiye': 'tr', 'tur': 'tr',
      'russia': 'ru', 'россия': 'ru', 'rus': 'ru',
      
      // Asian countries
      'japan': 'jp', '日本': 'jp', 'jpn': 'jp',
      'china': 'cn', '中国': 'cn', 'chn': 'cn', 'peoples china': 'cn',
      'india': 'in', 'भारत': 'in', 'ind': 'in',
      'south korea': 'kr', 'korea': 'kr', '대한민국': 'kr', 'kor': 'kr',
      'thailand': 'th', 'ประเทศไทย': 'th', 'tha': 'th',
      'singapore': 'sg', 'sgp': 'sg',
      'malaysia': 'my', 'mys': 'my',
      'philippines': 'ph', 'pilipinas': 'ph', 'phl': 'ph',
      'indonesia': 'id', 'idn': 'id',
      'vietnam': 'vn', 'việt nam': 'vn', 'vnm': 'vn',
      
      // Middle East & Africa
      'israel': 'il', 'ישראל': 'il', 'isr': 'il',
      'egypt': 'eg', 'مصر': 'eg', 'egy': 'eg',
      'south africa': 'za', 'zaf': 'za',
      'nigeria': 'ng', 'nga': 'ng',
      'kenya': 'ke', 'ken': 'ke',
      'morocco': 'ma', 'المغرب': 'ma', 'mar': 'ma',
      'pakistan': 'pk', 'pak': 'pk', 'پاکستان': 'pk',
      'bangladesh': 'bd', 'bgd': 'bd', 'বাংলাদেশ': 'bd',
      'iran': 'ir', 'irn': 'ir', 'ایران': 'ir',
      'iraq': 'iq', 'irq': 'iq', 'العراق': 'iq',
      'afghanistan': 'af', 'afg': 'af', 'افغانستان': 'af',
      'sri lanka': 'lk', 'lka': 'lk', 'ශ්‍රී ලංකා': 'lk',
      'nepal': 'np', 'npl': 'np', 'नेपाल': 'np',
      'myanmar': 'mm', 'mmr': 'mm', 'burma': 'mm',
      'cambodia': 'kh', 'khm': 'kh', 'កម្ពុជា': 'kh',
      'laos': 'la', 'lao': 'la', 'ລາວ': 'la',
      
      // Americas
      'brazil': 'br', 'brasil': 'br', 'bra': 'br',
      'mexico': 'mx', 'méxico': 'mx', 'mex': 'mx',
      'argentina': 'ar', 'arg': 'ar',
      'chile': 'cl', 'chl': 'cl',
      'peru': 'pe', 'perú': 'pe', 'per': 'pe',
      'colombia': 'co', 'col': 'co',
      'venezuela': 've', 'ven': 've',
      
      // Oceania
      'new zealand': 'nz', 'nzl': 'nz',
      'ireland': 'ie', 'éire': 'ie', 'irl': 'ie',
      
      // Additional common variations and edge cases
      'uae': 'ae', 'united arab emirates': 'ae', 'emirates': 'ae',
      'saudi arabia': 'sa', 'ksa': 'sa', 'saudi': 'sa',
      'papua new guinea': 'pg', 'png': 'pg',
      'costa rica': 'cr', 'cri': 'cr',
      'puerto rico': 'pr', 'pri': 'pr',
      'hong kong': 'hk', 'hkg': 'hk',
      'taiwan': 'tw', 'twn': 'tw', 'chinese taipei': 'tw',
      'north korea': 'kp', 'dprk': 'kp', 'democratic peoples korea': 'kp',
      'south sudan': 'ss', 'ssd': 'ss',
      'czech': 'cz', 'slovak republic': 'sk', 'slovakia': 'sk', 'svk': 'sk',
      'bosnia herzegovina': 'ba', 'bosnia': 'ba', 'bih': 'ba',
      'macedonia': 'mk', 'north macedonia': 'mk', 'mkd': 'mk',
      'montenegro': 'me', 'mne': 'me',
      'moldova': 'md', 'mda': 'md',
      'belarus': 'by', 'blr': 'by',
      'lithuania': 'lt', 'ltu': 'lt',
      'latvia': 'lv', 'lva': 'lv',
      'estonia': 'ee', 'est': 'ee',
      'slovenia': 'si', 'svn': 'si',
      'albania': 'al', 'alb': 'al',
      'cyprus': 'cy', 'cyp': 'cy',
      'malta': 'mt', 'mlt': 'mt',
      'luxembourg': 'lu', 'lux': 'lu',
      'liechtenstein': 'li', 'lie': 'li',
      'andorra': 'ad', 'and': 'ad',
      'monaco': 'mc', 'mco': 'mc',
      'san marino': 'sm', 'smr': 'sm',
      'vatican': 'va', 'vat': 'va', 'vatican city': 'va',
      'iceland': 'is', 'isl': 'is',
      'faroe islands': 'fo', 'fro': 'fo',
      'greenland': 'gl', 'grl': 'gl'
    }
    
    // Normalize the input country name
    const normalizedName = normalizeCountryName(countryName)
    
    // Direct lookup first
    let countryCode = countryToCode[normalizedName]
    
    // If not found, try partial matching for compound names
    if (!countryCode) {
      // Try to find a match by checking if any key contains the normalized name or vice versa
      for (const [key, code] of Object.entries(countryToCode)) {
        if (key.includes(normalizedName) || normalizedName.includes(key)) {
          countryCode = code
          break
        }
      }
    }
    
    // If still not found, try first word matching (for cases like "United States of America" -> "united")
    if (!countryCode && normalizedName.includes(' ')) {
      const firstWord = normalizedName.split(' ')[0]
      if (firstWord.length > 2) { // Only try if first word is meaningful
        for (const [key, code] of Object.entries(countryToCode)) {
          if (key.startsWith(firstWord) || key.includes(firstWord)) {
            countryCode = code
            break
          }
        }
      }
    }

    if (countryCode) {
      return `https://flagcdn.com/w40/${countryCode}.png`

    }

    

    // Log for debugging purposes (can be removed in production)
    if (countryName && countryName.trim()) {
      console.warn(`No flag found for country: "${countryName}" (normalized: "${normalizedName}")`)
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



  // Process leaderboard data for display - sort by stats value first

  const sortedData = [...leaderboardData].sort((a, b) => {
    const getNumericValue = (entry: LeaderboardEntry) => {
      switch (sortBy) {
        case 'xp':
          return entry.total_xp || entry.xp_delta || 0
        case 'catches':
          return entry.pokemon_caught || entry.catches_delta || 0
        case 'distance':
          return entry.distance_walked || entry.distance_delta || 0
        case 'pokestops':
          return entry.pokestops_visited || entry.pokestops_delta || 0
        default:
          return 0
      }
    }
    
    const aValue = getNumericValue(a)
    const bValue = getNumericValue(b)
    
    // Sort in descending order (highest values first)
    return bValue - aValue
  })

  // Check if we should aggregate data by country or team
  const shouldAggregateByCountry = activeTab === 'country' && (!selectedCountryFilter || selectedCountryFilter === 'all')
  const shouldAggregateByTeam = activeTab === 'team' && (!selectedTeamFilter || selectedTeamFilter === 'all')

  let processedData: Array<{
    rank: number;
    name: string;
    countryName: string | null;
    countryFlag: string | null;
    team: string | null;
    teamColor: string | null;
    statValue: number | string;
    medal: string | null;
    profileId: string | null;
    isAggregated?: boolean;
    aggregateType?: string;
  }>

  if (shouldAggregateByCountry) {
    // Aggregate data by country
    const countryAggregates = new Map()
    
    sortedData.forEach(entry => {
      // Normalize country name to handle variations in case/spacing
      const countryName = (entry.country || 'Unknown').trim()
      const normalizedCountryName = countryName.toLowerCase()
      
      if (!countryAggregates.has(normalizedCountryName)) {
        countryAggregates.set(normalizedCountryName, {
          country: countryName, // Use original case for display
          totalXp: 0,
          totalCatches: 0,
          totalDistance: 0,
          totalStops: 0,
          trainerCount: 0
        })
      }
      
      const aggregate = countryAggregates.get(normalizedCountryName)
      aggregate.totalXp += entry.total_xp || 0
      aggregate.totalCatches += entry.pokemon_caught || 0
      aggregate.totalDistance += entry.distance_walked || 0
      aggregate.totalStops += entry.pokestops_visited || 0
      aggregate.trainerCount += 1
    })

    // Convert to array and sort by selected stat
    console.log('Country aggregation results:', Array.from(countryAggregates.values()).map(c => ({ country: c.country, trainerCount: c.trainerCount, totalXp: c.totalXp })))
    const aggregatedData = Array.from(countryAggregates.values()).sort((a, b) => {
      let aValue, bValue
      switch (sortBy) {
        case 'xp': aValue = a.totalXp; bValue = b.totalXp; break
        case 'catches': aValue = a.totalCatches; bValue = b.totalCatches; break
        case 'distance': aValue = a.totalDistance; bValue = b.totalDistance; break
        case 'pokestops': aValue = a.totalStops; bValue = b.totalStops; break
        default: aValue = a.totalXp; bValue = b.totalXp
      }
      return bValue - aValue
    })

    processedData = aggregatedData.map((aggregate, index) => ({
      rank: index + 1,
      name: aggregate.country,
      countryName: aggregate.country,
      countryFlag: getCountryFlagUrl(aggregate.country),
      team: null,
      teamColor: null,
      statValue: (() => {
        switch (sortBy) {
          case 'xp': return aggregate.totalXp
          case 'catches': return aggregate.totalCatches
          case 'distance': return aggregate.totalDistance
          case 'pokestops': return aggregate.totalStops
          default: return aggregate.totalXp
        }
      })(),
    medal: index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : null,
      profileId: null, // No individual profile for aggregated data
      isAggregated: true,
      aggregateType: 'country'
    }))

  } else if (shouldAggregateByTeam) {
    // Aggregate data by team
    const teamAggregates = new Map()
    
    sortedData.forEach(entry => {
      // Normalize team name to handle variations in case/spacing
      const teamName = (entry.team_color || 'Unknown').trim()
      const normalizedTeamName = teamName.toLowerCase()
      
      if (!teamAggregates.has(normalizedTeamName)) {
        teamAggregates.set(normalizedTeamName, {
          team: teamName, // Use original case for display
          totalXp: 0,
          totalCatches: 0,
          totalDistance: 0,
          totalStops: 0,
          trainerCount: 0
        })
      }
      
      const aggregate = teamAggregates.get(normalizedTeamName)
      aggregate.totalXp += entry.total_xp || 0
      aggregate.totalCatches += entry.pokemon_caught || 0
      aggregate.totalDistance += entry.distance_walked || 0
      aggregate.totalStops += entry.pokestops_visited || 0
      aggregate.trainerCount += 1
    })

    // Convert to array and sort by selected stat
    console.log('Team aggregation results:', Array.from(teamAggregates.values()).map(t => ({ team: t.team, trainerCount: t.trainerCount, totalXp: t.totalXp })))
    const aggregatedData = Array.from(teamAggregates.values()).sort((a, b) => {
      let aValue, bValue
      switch (sortBy) {
        case 'xp': aValue = a.totalXp; bValue = b.totalXp; break
        case 'catches': aValue = a.totalCatches; bValue = b.totalCatches; break
        case 'distance': aValue = a.totalDistance; bValue = b.totalDistance; break
        case 'pokestops': aValue = a.totalStops; bValue = b.totalStops; break
        default: aValue = a.totalXp; bValue = b.totalXp
      }
      return bValue - aValue
    })

    processedData = aggregatedData.map((aggregate, index) => ({
      rank: index + 1,
      name: aggregate.team.charAt(0).toUpperCase() + aggregate.team.slice(1),
      countryName: null,
      countryFlag: null,
      team: getTeamColor(aggregate.team),
      teamColor: aggregate.team,
      statValue: (() => {
        switch (sortBy) {
          case 'xp': return aggregate.totalXp
          case 'catches': return aggregate.totalCatches
          case 'distance': return aggregate.totalDistance
          case 'pokestops': return aggregate.totalStops
          default: return aggregate.totalXp
        }
      })(),
      medal: index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : null,
      profileId: null, // No individual profile for aggregated data
      isAggregated: true,
      aggregateType: 'team'
    }))

  } else {
    // Normal individual trainer data
    processedData = sortedData.map((entry, index) => ({
      rank: index + 1,
      name: entry.trainer_name,
      countryName: entry.country,
      countryFlag: getCountryFlagUrl(entry.country),
      team: getTeamColor(entry.team_color),
      teamColor: entry.team_color,
      statValue: getStatValue(entry),
      medal: index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : null,
      profileId: entry.profile_id,
      isAggregated: false
    }))
  }




  // Locked Results: Show top 3 by default, top 10 when expanded
  // const lockedResults = lockedExpanded ? processedData.slice(0, 10) : processedData.slice(0, 3)

  // Responsive Live section: Mobile shows all users, Web shows only top 3 (except for all-time)
  // Live section should always show current period data (weekly/monthly/all-time)
  // For all-time period, both mobile and web should show all results
  const liveResults = (isMobile || timePeriod === 'alltime')
    ? processedData
    : processedData.slice(0, 3)

  

  // Debug logging for Live section

  console.log('Data processing - isMobile:', isMobile, 'leaderboardData length:', leaderboardData.length, 'processedData length:', processedData.length, 'liveResults length:', liveResults.length)



  // const getMedalIcon = (medal: string | null) => {
  //   // Function removed as it's no longer used
  // }



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

            margin: '0px auto',

            width: '690px',

            height: '36px',

            flex: '0 0 auto',

            order: 0,

          }}>

            {/* Week */}

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

                Week

              </span>

            </button>



            {/* Month */}

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

                Month

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

                width: 'auto',
                minWidth: '47px',

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

                All Time

              </span>

            </button>

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

              margin: '0 auto',

              width: '90px',

              height: '36px',

              border: '1px solid #DC2627',

              borderRadius: '4px',

              flex: 'none',

              order: 1,

              flexGrow: 0,

              cursor: 'pointer',

              background: 'transparent',

              opacity: exporting ? 0.7 : 1,

            }}>

            <Upload style={{

              /* Vector */

              display: 'flex',

              flexDirection: 'row',

              justifyContent: 'center',

              alignItems: 'center',

              padding: '0px',

              gap: '10px',

              width: '24px',

              height: '24px',

              flex: 'none',

              order: 0,

              flexGrow: 0,

              color: '#DC2627',

            }} />

            <span style={{

              /* Export */

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



        {/* Frame 586 - Locked Results Section - Only show for Week/Month */}
        {timePeriod !== 'alltime' && (
          <div style={{

            display: 'flex',

            flexDirection: 'column',

            alignItems: 'center',

            padding: '12px 8px',

            gap: '8px',

            width: '826px',

            height: lockedExpanded ? 'auto' : '259px',

            background: 'rgba(0, 0, 0, 0.1)',

            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.05)',

            borderRadius: '8px',

            flex: 'none',

            order: 2,

            flexGrow: 0,

          }}>

          {/* Locked Results Header with Dropdown */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0px',
            width: '810px',
            height: '24px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '13px',
            }}>
              {/* Trophy Icon */}
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 18 18" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  position: 'relative',
                }}
              >
                <path d="M4 18V16H8V12.9C7.18333 12.7167 6.45433 12.371 5.813 11.863C5.17167 11.355 4.70067 10.7173 4.4 9.95C3.15 9.8 2.10433 9.25433 1.263 8.313C0.421667 7.37167 0.000666667 6.26733 0 5V4C0 3.45 0.196 2.97933 0.588 2.588C0.98 2.19667 1.45067 2.00067 2 2H4V0H14V2H16C16.55 2 17.021 2.196 17.413 2.588C17.805 2.98 18.0007 3.45067 18 4V5C18 6.26667 17.579 7.371 16.737 8.313C15.895 9.255 14.8493 9.80067 13.6 9.95C13.3 10.7167 12.8293 11.3543 12.188 11.863C11.5467 12.3717 10.8173 12.7173 10 12.9V16H14V18H4ZM4 7.8V4H2V5C2 5.63333 2.18333 6.20433 2.55 6.713C2.91667 7.22167 3.4 7.584 4 7.8ZM9 11C9.83333 11 10.5417 10.7083 11.125 10.125C11.7083 9.54167 12 8.83333 12 8V2H6V8C6 8.83333 6.29167 9.54167 6.875 10.125C7.45833 10.7083 8.16667 11 9 11ZM14 7.8C14.6 7.58333 15.0833 7.22067 15.45 6.712C15.8167 6.20333 16 5.63267 16 5V4H14V7.8Z" 
                fill="#DC2627"
              />
            </svg>

            {/* Locked Results Title */}
            <span style={{
              width: 'auto',
              minWidth: '175px',
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
              textAlign: 'left',
            }}>
              Locked Results
            </span>
          </div>

          {/* Dropdown Button */}
          <button
            onClick={() => setLockedExpanded(!lockedExpanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0px',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '8px',
            }}
          >
            <svg 
              width="38" 
              height="24" 
              viewBox="0 0 38 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: lockedExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.2s ease'
              }}
            >
              <rect x="0.5" y="0.5" width="37" height="23" rx="11.5" stroke="black"/>
              <path d="M18.7642 14.4707C18.8267 14.5332 18.9121 14.5684 19.0005 14.5684C19.0887 14.5683 19.1734 14.5331 19.2358 14.4707L23.5962 10.1094L23.1245 9.63867L19.354 13.4102L19.0005 13.7637L14.8755 9.63867L14.4038 10.1104L18.7642 14.4707Z" fill="black" stroke="black"/>
            </svg>
          </button>
          </div>

        {/* Locked Results Content - Always show top 3, show top 10 when expanded */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '0px',
          width: '810px',
          borderRadius: '8px',
          flex: 'none',
          order: 1,
          flexGrow: 0,
        }}>
          {/* Always show top 3 results */}
          {processedData.slice(0, 3).map((player, index) => 
            renderWebLockedPlayerCard(player, index)
          )}

          {/* Additional results (positions 4-10) shown only when expanded */}
          {lockedExpanded && (
            <>
              {processedData.slice(3, 10).map((player, index) => 
                renderWebLockedPlayerCard(player, index + 3)
              )}
            </>
          )}
        </div>

          </div>
        )}



        {/* Frame 605 - Month Results Container */}

        <div style={{

          /* Frame 605 */

          /* Auto layout */

          display: 'flex',

          flexDirection: 'column',

          alignItems: 'flex-start',

          padding: '0px',

          gap: '24px',

          width: '826px',

          height: timePeriod === 'alltime' ? 'auto' : '627px',
          maxHeight: timePeriod === 'alltime' ? '800px' : '627px',
          overflowY: timePeriod === 'alltime' ? 'auto' : 'visible',

          /* Inside auto layout */

          flex: 'none',

          order: 3,

          flexGrow: 0,

        }}>

          {/* Frame 530 - Month Leaderboard */}

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

            {renderWebMonthResults()}

          </div>

        </div>

      </>

    )

  }



  const renderWebMonthResults = () => {

    // For all periods: show all results from position 1 onwards
    const allMainResults = processedData

    

    return (

      <>

        {/* Frame 573 - Header with Dropdown */}

        <div style={{

          /* Frame 573 */

          /* Auto layout */

          display: 'flex',

          flexDirection: 'row',

          justifyContent: 'space-between',

          alignItems: 'center',

          padding: '0px',

          width: '810px',

          height: '24px',

          /* Inside auto layout */

          flex: 'none',

          order: 0,

          flexGrow: 0,

        }}>

          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '13px',
        }}>

          {/* material-symbols:trophy-outline */}

          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 18 18" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{
              flex: 'none',
              order: 0,
              flexGrow: 0,
              position: 'relative',
            }}
          >
            <path d="M4 18V16H8V12.9C7.18333 12.7167 6.45433 12.371 5.813 11.863C5.17167 11.355 4.70067 10.7173 4.4 9.95C3.15 9.8 2.10433 9.25433 1.263 8.313C0.421667 7.37167 0.000666667 6.26733 0 5V4C0 3.45 0.196 2.97933 0.588 2.588C0.98 2.19667 1.45067 2.00067 2 2H4V0H14V2H16C16.55 2 17.021 2.196 17.413 2.588C17.805 2.98 18.0007 3.45067 18 4V5C18 6.26667 17.579 7.371 16.737 8.313C15.895 9.255 14.8493 9.80067 13.6 9.95C13.3 10.7167 12.8293 11.3543 12.188 11.863C11.5467 12.3717 10.8173 12.7173 10 12.9V16H14V18H4ZM4 7.8V4H2V5C2 5.63333 2.18333 6.20433 2.55 6.713C2.91667 7.22167 3.4 7.584 4 7.8ZM9 11C9.83333 11 10.5417 10.7083 11.125 10.125C11.7083 9.54167 12 8.83333 12 8V2H6V8C6 8.83333 6.29167 9.54167 6.875 10.125C7.45833 10.7083 8.16667 11 9 11ZM14 7.8C14.6 7.58333 15.0833 7.22067 15.45 6.712C15.8167 6.20333 16 5.63267 16 5V4H14V7.8Z" 
              fill="black"
            />
          </svg>

            {/* Live Section Title */}

          <span style={{

            width: 'auto',
            minWidth: '175px',

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

            textAlign: 'left',

          }}>

            {timePeriod === 'alltime' ? 'Live' : 
             timePeriod === 'weekly' ? 'Live' : 'Live'}

          </span>

        </div>

          {/* Dropdown Button - Hidden in All Time view */}
          {timePeriod !== 'alltime' && (
          <button
            onClick={() => setWebLiveExpanded(!webLiveExpanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0px',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '8px',
            }}
          >
            <svg 
              width="38" 
              height="24" 
              viewBox="0 0 38 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: webLiveExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.2s ease'
              }}
            >
              <rect x="0.5" y="0.5" width="37" height="23" rx="11.5" stroke="black"/>
              <path d="M18.7642 14.4707C18.8267 14.5332 18.9121 14.5684 19.0005 14.5684C19.0887 14.5683 19.1734 14.5331 19.2358 14.4707L23.5962 10.1094L23.1245 9.63867L19.354 13.4102L19.0005 13.7637L14.8755 9.63867L14.4038 10.1104L18.7642 14.4707Z" fill="black" stroke="black"/>
            </svg>
          </button>
          )}

        </div>







        {/* Frame 574 - Main Results Container */}

        {webLiveExpanded && allMainResults.length > 0 && (

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



            {allMainResults.map((player, index) => renderWebMonthPlayerCard(player, index))}

        </div>

        )}

      </>

    )

  }



  const renderWebLockedPlayerCard = (player: any, index: number) => {
    const teamColorHex = getTeamColorHex(player.teamColor || player.team)

    return (
      <div 
        key={index} 
        className="hover:scale-102 transition-transform duration-200 ease-in-out cursor-pointer"
        style={{
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
                {/* Use SVG medals for top 3 in Locked section */}
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
                    color: '#FFFFFF',
                  }}>
                    {player.rank}
                  </span>
                )}
              </div>

              {/* Player Info */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0px',
                gap: '4px',
                width: '200px',
                height: '33px',
                flex: 'none',
                order: 1,
                flexGrow: 0,
              }}>
                {/* Player Name */}
                <span 
                  style={{
                  width: '200px',
                  height: '21px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '21px',
                    color: trialStatus.canClickIntoProfiles ? '#000000' : '#666666',
                  textAlign: 'left',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                    cursor: (trialStatus.canClickIntoProfiles && player.profileId) ? 'pointer' : 'default',
                  }}
                  onClick={(e) => handlePreviewClick(e, player.profileId)}
                  title={player.profileId ? (trialStatus.canClickIntoProfiles ? "View profile" : "Upgrade to view profiles") : ""}
                >
                  {player.name}
                  {!trialStatus.canClickIntoProfiles && player.profileId && <span style={{ marginLeft: '4px' }}>🔒</span>}
                </span>

                  {/* Country Flag and Team */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: '0px',
                    gap: '8px',
                    width: '200px',
                    height: '12px',
                    flex: 'none',
                    order: 1,
                    flexGrow: 0,
                  }}>
                    {/* Country Flag - Hidden for team aggregation */}
                    {!(player.isAggregated && player.aggregateType === 'team') && player.countryFlag && (
                    <img 
                        src={player.countryFlag || ''}
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
                        fallback.style.cssText = 'font-size: 12px; line-height: 12px; display: flex; align-items: center; justify-content: center;';
                        target.parentNode?.insertBefore(fallback, target);
                      }}
                    />
                    )}

                    {/* Team Color Circle - Hidden for country aggregation */}
                    {!(player.isAggregated && player.aggregateType === 'country') && teamColorHex && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: teamColorHex,
                      borderRadius: '50%',
                      flex: 'none',
                      order: 1,
                      flexGrow: 0,
                    }} />
                    )}

                    {/* Team Name */}
                    <span style={{
                      width: 'auto',
                      height: '12px',
                      fontFamily: 'Poppins',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      fontSize: '10px',
                      lineHeight: '12px',
                      color: '#666666',
                      flex: 'none',
                      order: 2,
                      flexGrow: 0,
                    }}>
                      {player.team}
                    </span>
                  </div>
              </div>
            </div>

            {/* Frame 583 - Right Section (Stat Value) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              padding: '0px',
              gap: '4px',
              width: '100px',
              height: '33px',
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              <span style={{
                width: '100px',
                height: '21px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#000000',
                textAlign: 'right',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                {player.statValue}
              </span>
            </div>
          </div>
        </div>
    )
  }

  const renderWebMonthPlayerCard = (player: any, index: number) => {

    const teamColorHex = getTeamColorHex(player.teamColor || player.team)

    

    return (

      <div 
        key={index} 
        className="hover:scale-102 transition-transform duration-200 ease-in-out cursor-pointer"
        style={{

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

              {/* Always use circle with number format for Live section */}
              <span style={{
                width: '6px',
                height: '21px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '21px',
                  textAlign: 'center',
                color: '#FFFFFF',
            }}>
                {player.rank}
              </span>

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

              <span 
                style={{
                width: '120px',
                height: '18px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                /* identical to box height */
                textAlign: 'left',
                  color: trialStatus.canClickIntoProfiles ? '#000000' : '#666666',
                /* Inside auto layout */
                flex: 'none',
                order: 0,
                flexGrow: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                  cursor: (trialStatus.canClickIntoProfiles && player.profileId) ? 'pointer' : 'default',
                }}
                onClick={(e) => handlePreviewClick(e, player.profileId)}
                title={player.profileId ? (trialStatus.canClickIntoProfiles ? "View profile" : "Upgrade to view profiles") : ""}
              >
                {player.name}
                {!trialStatus.canClickIntoProfiles && <span style={{ marginLeft: '4px' }}>🔒</span>}
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

                  {!(player.isAggregated && player.aggregateType === 'team') && player.countryFlag && (
                  <img 

                      src={player.countryFlag || ''}

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
                  )}

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

                  {/* Team Color Circle - Ellipse 3 - Hidden for country aggregation */}
                  {!(player.isAggregated && player.aggregateType === 'country') && teamColorHex && (
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
                  )}

                  

                  {/* Team Name - Hidden for country aggregation */}
                  {!(player.isAggregated && player.aggregateType === 'country') && player.team && (
                  <span style={{

                    fontFamily: 'Poppins',

                    fontStyle: 'normal',

                    fontWeight: 400,

                    fontSize: '9px',

                    lineHeight: '15px',

                    textAlign: 'left',

                    color: 'black',

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
                  )}

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

            <span 
              className="hover:scale-110 transition-transform duration-200 ease-in-out"
              style={{

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

                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleTabChange('trainers')
                }}

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

                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleTabChange('country')
                }}

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

                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleTabChange('team')
                }}

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

            gap: '12px',

            width: '826px',

            //height: '1024px',

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

              {/* Dynamic Dropdown */}

              <div 

                data-dropdown

                style={{

                  position: 'relative',

                  width: '397px',

                  height: '36px',

                  flex: 'none',

                  order: 0,

                  flexGrow: 0,

                }}>

                <div 

                  onClick={handleDynamicDropdownClick}

                  style={{

                boxSizing: 'border-box',

                display: 'flex',

                flexDirection: 'row',

                justifyContent: 'space-between',

                alignItems: 'center',

                padding: '4px 8px',

                gap: '8px',

                margin: '0 auto',

                width: '397px',

                height: '36px',

                border: '1px solid #000000',

                borderRadius: '6px',

                    cursor: activeTab === 'trainers' ? 'default' : 'pointer',

                    background: 'transparent',

                  }}>

                  <span style={{

                    /* All Trainers */

                    width: 'auto',

                    minWidth: '120px',

                    height: '18px',

                    fontFamily: 'Poppins',

                    fontStyle: 'normal',

                    fontWeight: 600,

                    fontSize: '12px',

                    lineHeight: '18px',

                    color: (selectedTeamFilter || selectedCountryFilter || selectedTrainerFilter) ? '#DC2627' : '#000000',

                    flex: '1',

                order: 0,

                    flexGrow: 1,

                    textAlign: 'left',

                    whiteSpace: 'nowrap',

                  }}>

                    {selectedDynamicValue}

                  </span>

                  {/* Hide ChevronDown for trainers tab */}
                  {activeTab !== 'trainers' && (
                  <ChevronDown style={{

                    /* Dropdown */

                    display: 'flex',

                    flexDirection: 'column',

                    justifyContent: 'center',

                    alignItems: 'center',

                    padding: '0px',

                    gap: '10px',

                    width: '16px',

                    height: '16px',

                    flex: 'none',

                    order: 1,

                    flexGrow: 0,

                    color: '#000000',

                    transform: showDynamicDropdown ? 'rotate(180deg)' : 'rotate(0deg)',

                    transition: 'transform 0.2s ease',

                    marginLeft: 'auto'

                  }} />
                  )}

                </div>

                

                {/* Dynamic Dropdown Menu */}

                {showDynamicDropdown && (

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

                    {getDynamicDropdownData().map((item, index) => (

                                         <div 

                        key={item.id}

                        onClick={() => handleDynamicSelect(item)}

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

                          {activeTab === 'team' && 'color' in item && item.color ? (

                            <div style={{

                              width: '12px',

                              height: '12px',

                              backgroundColor: item.color as string,

                              borderRadius: '50%',

                            }} />

                          ) : null}

                          {activeTab === 'country' && 'flag' in item && item.flag && item.id !== 'all' ? (

                            <img 

                              src={item.flag} 

                              alt={item.name}

                              style={{

                                width: '16px',

                                height: '12px',

                                objectFit: 'cover',

                              }}

                            />

                          ) : null}

                          {item.name}

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

                  width: '398px',

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

                    margin: '0 auto',

                    width: '398px',

                    height: '36px',

                    border: '1px solid #000000',

                    borderRadius: '6px',

                    cursor: 'pointer',

                    background: 'transparent',

              }}>

                <span style={{

                    /* Total XP */

                    width: 'auto',

                    minWidth: '120px',

                  height: '18px',

                  fontFamily: 'Poppins',

                  fontStyle: 'normal',

                  fontWeight: 600,

                  fontSize: '12px',

                  lineHeight: '18px',

                  color: '#000000',

                    flex: '1',

                  order: 0,

                    flexGrow: 1,

                    textAlign: 'left',

                    whiteSpace: 'nowrap',

                }}>

                    {sortOptions.find(opt => opt.id === sortBy)?.label || 'Total XP'}

                </span>

                <ChevronDown style={{

                  /* Dropdown */

                          display: 'flex',

                          flexDirection: 'column',

                          justifyContent: 'center',

                alignItems: 'center',

                  padding: '0px',

                  gap: '10px',

                  width: '16px',

                  height: '16px',

                  flex: 'none',

                  order: 1,

                  flexGrow: 0,

                  color: '#000000',

                    transform: showProxyDropdown ? 'rotate(180deg)' : 'rotate(0deg)',

                    transition: 'transform 0.2s ease',

                    marginLeft: 'auto'

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

          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleTabChange('trainers')
          }}

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

          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleTabChange('country')
          }}

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

          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleTabChange('team')
          }}

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

          gap: '50px',

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

          gap: '16px',

          width: '353px',

          height: '36px',

          flex: 'none',

          order: 1,

          alignSelf: 'stretch',

          flexGrow: 0,

        }}

      >

            {/* Dynamic Dropdown */}

        <div 

              data-dropdown

          style={{

                /* Overall */

            boxSizing: 'border-box',

            display: 'flex',

            flexDirection: 'row',

            justifyContent: 'space-between',

            alignItems: 'center',

            padding: '4px 8px',

            gap: '8px',

            margin: '0 auto',

            width: '160px',

            height: '36px',

            border: '1px solid #000000',

            borderRadius: '6px',

            flex: 'none',

            order: 0,

            flexGrow: 0,

            background: 'transparent',

                position: 'relative',

            cursor: activeTab === 'trainers' ? 'default' : 'pointer',

          }}

              onClick={activeTab === 'trainers' ? undefined : () => setShowDynamicDropdown(!showDynamicDropdown)}

        >

          <span 

            style={{

                  /* All Countries */

              width: 'auto',

              minWidth: '100px',

              height: '18px',

              fontFamily: 'Poppins',

                  fontStyle: 'normal',

              fontWeight: 600,

              fontSize: '12px',

              lineHeight: '18px',

              color: '#000000',

              flex: '1',

              order: 0,

              flexGrow: 1,

              textAlign: 'left',

              whiteSpace: 'nowrap',

            }}

          >

                {selectedDynamicValue}

          </span>

              {/* Dropdown Icon - Hidden for trainers tab */}
              {activeTab !== 'trainers' && (
          <ChevronDown 

            style={{ 

                  /* Dropdown */

                  display: 'flex',

                  flexDirection: 'column',

                  justifyContent: 'center',

                  alignItems: 'center',

                  padding: '0px',

                  gap: '10px',

                  width: '16px',

                  height: '16px',

              flex: 'none',

              order: 1,

              flexGrow: 0,

                  color: '#000000',

                  marginLeft: 'auto',

            }} 

          />
              )}

              

              {/* Dropdown Menu */}

              {showDynamicDropdown && (

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

                  {getDynamicDropdownData().map((item) => (

                    <div 

                      key={item.id}

                      style={{

                        padding: '8px 12px',

                        cursor: 'pointer',

                        fontSize: '12px',

                        fontFamily: 'Poppins',

                        color: '#000000',

                        borderBottom: '1px solid #f0f0f0',

                        backgroundColor: (activeTab === 'team' && selectedTeamFilter === item.id) || 

                                       (activeTab === 'country' && selectedCountryFilter === item.name) || 

                                       (activeTab === 'trainers' && ((item.id === 'all' && !selectedTrainerFilter) || selectedTrainerFilter === item.name)) ? '#f8f9fa' : 'transparent',

                        display: 'flex',

                        alignItems: 'center',

                        gap: '8px',

                      }}

                      onClick={(e) => {

                        e.stopPropagation();

                        handleDynamicSelect(item);

                      }}

                      onMouseEnter={(e) => {

                        e.currentTarget.style.backgroundColor = '#f8f9fa';

                      }}

                      onMouseLeave={(e) => {

                        const isSelected = (activeTab === 'team' && selectedTeamFilter === item.id) || 

                                         (activeTab === 'country' && selectedCountryFilter === item.name) || 

                                         (activeTab === 'trainers' && ((item.id === 'all' && !selectedTrainerFilter) || selectedTrainerFilter === item.name));

                        e.currentTarget.style.backgroundColor = isSelected ? '#f8f9fa' : 'transparent';

                      }}

                    >

                      {activeTab === 'team' && 'color' in item && item.color ? (

                      <div 

                        style={{

                          width: '12px',

                          height: '12px',

                          borderRadius: '50%',

                            backgroundColor: item.color as string,

                          }}

                        />

                      ) : null}

                      {activeTab === 'country' && 'flag' in item && item.flag && item.id !== 'all' ? (

                        <img 

                          src={item.flag} 

                          alt={item.name}

                        style={{

                          width: '16px',

                          height: '12px',

                          objectFit: 'cover',

                          }}

                        />

                      ) : null}

                      {item.name}

                    </div>

                  ))}

                </div>

              )}

            </div>

            {/* Total XP Dropdown */}

            <div 

              data-dropdown

              style={{

                /* Scores */

                boxSizing: 'border-box',

                display: 'flex',

                flexDirection: 'row',

                justifyContent: 'space-between',

                alignItems: 'center',

                padding: '4px 8px',

                gap: '8px',

                margin: '0 auto',

                width: '160px',

                height: '36px',

                border: '1px solid #000000',

                borderRadius: '6px',

                flex: 'none',

            order: 1,

                flexGrow: 0,

                background: 'transparent',

                position: 'relative',

                cursor: 'pointer',

              }}

              onClick={() => setShowStatsDropdown(!showStatsDropdown)}

        >

          <span 

            style={{

                  /* Total XP */

              width: 'auto',

              minWidth: '100px',

              height: '18px',

              fontFamily: 'Poppins',

                  fontStyle: 'normal',

              fontWeight: 600,

              fontSize: '12px',

              lineHeight: '18px',

              color: '#000000',

              flex: '1',

              order: 0,

              flexGrow: 1,

              textAlign: 'left',

              whiteSpace: 'nowrap',

            }}

          >

            {sortOptions.find(opt => opt.id === sortBy)?.label || 'Total XP'}

          </span>

              {/* Dropdown Icon */}

          <ChevronDown 

            style={{ 

                  /* Dropdown */

                  display: 'flex',

                  flexDirection: 'column',

                  justifyContent: 'center',

                  alignItems: 'center',

                  padding: '0px',

                  gap: '10px',

                  width: '16px',

                  height: '16px',

              flex: 'none',

              order: 1,

              flexGrow: 0,

                  color: '#000000',

                  marginLeft: 'auto',

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

                        color: '#000000',

                        borderBottom: '1px solid #f0f0f0',

                        backgroundColor: sortBy === option.id ? '#f8f9fa' : '#FFFFFF',

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

                        e.currentTarget.style.backgroundColor = sortBy === option.id ? '#f8f9fa' : '#FFFFFF';

                      }}

                    >

                      {option.label}

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

              //height: '36px',

                /* Inside auto layout */

              flex: 'none',

                order: 1,

              alignSelf: 'stretch',

                  flexGrow: 0,

                }}

              >

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

          justifyContent: 'space-between',

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

          {/* Week */}

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
                whiteSpace: 'nowrap',

              }}

            >

              Week

            </span>

          </div>



          {/* Month */}

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
                whiteSpace: 'nowrap',

              }}

            >

              Month

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
                whiteSpace: 'nowrap',

              }}

            >

              All Time

            </span>

          </div>

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

            width: '80px',

            height: '36px',

            border: '1px solid #DC2627',

            borderRadius: '4px',

            cursor: 'pointer',

            flex: 'none',

            order: 1,

            flexGrow: 0,

            background: 'transparent',

            opacity: exporting ? 0.7 : 1,

          }}

        >

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

            {exporting ? 'Export...' : 'Export'}

          </span>

        </div>

      </div>

      {/* Component 5 - Locked Results - Only show for Week/Month */}
      {timePeriod !== 'alltime' && (
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

          height: lockedExpanded ? 'auto' : '213px',

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

            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 18 18" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M4 18V16H8V12.9C7.18333 12.7167 6.45433 12.371 5.813 11.863C5.17167 11.355 4.70067 10.7173 4.4 9.95C3.15 9.8 2.10433 9.25433 1.263 8.313C0.421667 7.37167 0.000666667 6.26733 0 5V4C0 3.45 0.196 2.97933 0.588 2.588C0.98 2.19667 1.45067 2.00067 2 2H4V0H14V2H16C16.55 2 17.021 2.196 17.413 2.588C17.805 2.98 18.0007 3.45067 18 4V5C18 6.26667 17.579 7.371 16.737 8.313C15.895 9.255 14.8493 9.80067 13.6 9.95C13.3 10.7167 12.8293 11.3543 12.188 11.863C11.5467 12.3717 10.8173 12.7173 10 12.9V16H14V18H4ZM4 7.8V4H2V5C2 5.63333 2.18333 6.20433 2.55 6.713C2.91667 7.22167 3.4 7.584 4 7.8ZM9 11C9.83333 11 10.5417 10.7083 11.125 10.125C11.7083 9.54167 12 8.83333 12 8V2H6V8C6 8.83333 6.29167 9.54167 6.875 10.125C7.45833 10.7083 8.16667 11 9 11ZM14 7.8C14.6 7.58333 15.0833 7.22067 15.45 6.712C15.8167 6.20333 16 5.63267 16 5V4H14V7.8Z" 
                fill="#DC2627"
              />
            </svg>

            <span style={{

              fontFamily: 'Poppins',

              fontWeight: 600,

              fontSize: '12px',

              lineHeight: '24px',

              color: '#DC2627',

              whiteSpace: 'nowrap',

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
              transform: lockedExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.2s ease',
              marginLeft: '8px'
            }}
          >
            <rect x="0.5" y="0.5" width="37" height="23" rx="11.5" stroke="black"/>
            <path d="M18.7642 14.4707C18.8267 14.5332 18.9121 14.5684 19.0005 14.5684C19.0887 14.5683 19.1734 14.5331 19.2358 14.4707L23.5962 10.1094L23.1245 9.63867L19.354 13.4102L19.0005 13.7637L14.8755 9.63867L14.4038 10.1104L18.7642 14.4707Z" fill="black" stroke="black"/>
          </svg>

        </button>



        {/* Always show top 3 results, show top 10 when expanded */}
          <div style={{

            display: 'flex',

            flexDirection: 'column',

            gap: '8px',

            width: '100%',

            maxWidth: '337px',

          }}>

          {/* Always show top 3 results */}
          {processedData.slice(0, 3).map((player, index) => (

              <div

                key={index}
                className="hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer"

                style={{

                  /* Frame 532/533/534 - Top 3 entries */

                  display: 'flex',

                  flexDirection: 'row',

                  alignItems: 'center',

                  padding: '12px',

                  gap: '12px',

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

                  {/* Rank Badge - Use SVG medals for top 3 in Locked section */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '24px',
                    height: '24px',
                    background: '#DC2627',
                    borderRadius: '50%',
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
                        fontFamily: 'Poppins',
                        fontWeight: 600,
                        fontSize: '14px',
                        lineHeight: '21px',
                        color: '#FFFFFF',
                      }}>
                        {player.rank}
                      </span>
                    )}
                  </div>



                  {/* Name and Location */}

                  <div style={{

                    display: 'flex',

                    flexDirection: 'column',

                    gap: '2px',

                  }}>

                    <span 
                      style={{
                      fontFamily: 'Poppins',
                      fontWeight: 600,
                      fontSize: '12px',
                      lineHeight: '18px',
                        color: trialStatus.canClickIntoProfiles ? '#000000' : '#666666',
                        cursor: (trialStatus.canClickIntoProfiles && player.profileId) ? 'pointer' : 'default',
                      }}
                      onClick={(e) => handlePreviewClick(e, player.profileId)}
                      title={player.profileId ? (trialStatus.canClickIntoProfiles ? "View profile" : "Upgrade to view profiles") : ""}
                    >
                      {player.name}
                      {!trialStatus.canClickIntoProfiles && <span style={{ marginLeft: '4px' }}>🔒</span>}
                    </span>

                    

                    {/* Country and Team */}

                    <div style={{

                      display: 'flex',

                      alignItems: 'center',

                      gap: '6px',

                    }}>

                      <img 

                        src={player.countryFlag || ''}

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

                  <span 
                    className="hover:scale-110 transition-transform duration-200 ease-in-out"
                    style={{

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

          {/* Additional results (positions 4-10) shown only when expanded */}
          {lockedExpanded && (
            <>
              {processedData.slice(3, 10).map((player, index) => (
                <div
                  key={index + 3}
                  className="hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: '12px',
                    gap: '12px',
                    width: '337px',
                    height: '47px',
                    background: '#FFFFFF',
                    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                    borderRadius: '8px',
                    flex: 'none',
                    order: index + 3,
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
                    {/* Rank Badge - Use SVG medals for top 3 in Locked section */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '24px',
                      height: '24px',
                      background: '#DC2627',
                      borderRadius: '50%',
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
                          fontFamily: 'Poppins',
                          fontWeight: 600,
                          fontSize: '14px',
                          lineHeight: '21px',
                          color: '#FFFFFF',
                        }}>
                          {player.rank}
                        </span>
                      )}
                    </div>

                    {/* Name and Location */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}>
                      <span 
                        style={{
                        fontFamily: 'Poppins',
                        fontWeight: 600,
                        fontSize: '12px',
                        lineHeight: '18px',
                          color: trialStatus.canClickIntoProfiles ? '#000000' : '#666666',
                          cursor: (trialStatus.canClickIntoProfiles && player.profileId) ? 'pointer' : 'default',
                        }}
                        onClick={(e) => handlePreviewClick(e, player.profileId)}
                        title={player.profileId ? (trialStatus.canClickIntoProfiles ? "View profile" : "Upgrade to view profiles") : ""}
                      >
                        {player.name}
                        {!trialStatus.canClickIntoProfiles && <span style={{ marginLeft: '4px' }}>🔒</span>}
                      </span>

                      {/* Country and Team */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        {!(player.isAggregated && player.aggregateType === 'team') && player.countryFlag && (
                        <img 
                            src={player.countryFlag || ''}
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
                        )}

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
                    <span 
                      className="hover:scale-110 transition-transform duration-200 ease-in-out"
                      style={{
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
                      color: '#666666',
                    }}>
                      {sortBy === 'xp' ? 'XP' : sortBy === 'catches' ? 'Catches' : sortBy === 'distance' ? 'km' : 'Pokestops'}
                    </span>
                  </div>
                </div>
              ))}
            </>
        )}

      </div>

      </div>
      )}



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

           marginTop: '20px',

           flex: 'none',

           order: 5,

           flexGrow: 0,

         }}

       >

         {/* Live Header */}

         <button

           onClick={timePeriod !== 'alltime' ? () => setLiveExpanded(!liveExpanded) : undefined}

           style={{

             display: 'flex',

             alignItems: 'center',

             justifyContent: 'space-between',

             width: '96%',

             padding: '8px 0',

             background: 'transparent',

             border: 'none',

             cursor: timePeriod !== 'alltime' ? 'pointer' : 'default',

           }}

         >

           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

             <svg 
               width="24" 
               height="24" 
               viewBox="0 0 18 18" 
               fill="none" 
               xmlns="http://www.w3.org/2000/svg"
             >
               <path d="M4 18V16H8V12.9C7.18333 12.7167 6.45433 12.371 5.813 11.863C5.17167 11.355 4.70067 10.7173 4.4 9.95C3.15 9.8 2.10433 9.25433 1.263 8.313C0.421667 7.37167 0.000666667 6.26733 0 5V4C0 3.45 0.196 2.97933 0.588 2.588C0.98 2.19667 1.45067 2.00067 2 2H4V0H14V2H16C16.55 2 17.021 2.196 17.413 2.588C17.805 2.98 18.0007 3.45067 18 4V5C18 6.26667 17.579 7.371 16.737 8.313C15.895 9.255 14.8493 9.80067 13.6 9.95C13.3 10.7167 12.8293 11.3543 12.188 11.863C11.5467 12.3717 10.8173 12.7173 10 12.9V16H14V18H4ZM4 7.8V4H2V5C2 5.63333 2.18333 6.20433 2.55 6.713C2.91667 7.22167 3.4 7.584 4 7.8ZM9 11C9.83333 11 10.5417 10.7083 11.125 10.125C11.7083 9.54167 12 8.83333 12 8V2H6V8C6 8.83333 6.29167 9.54167 6.875 10.125C7.45833 10.7083 8.16667 11 9 11ZM14 7.8C14.6 7.58333 15.0833 7.22067 15.45 6.712C15.8167 6.20333 16 5.63267 16 5V4H14V7.8Z" 
                 fill="#DC2627"
               />
             </svg>

             <span style={{

               fontFamily: 'Poppins',

               fontWeight: 600,

               fontSize: '16px',

               lineHeight: '24px',

               color: '#DC2627',

             }}>

               {timePeriod === "monthly" ? "Live" : "Live"}

             </span>

           </div>

           {/* Dropdown Button - Hidden in All Time view */}
           {timePeriod !== 'alltime' && (
           <svg 
             width="38" 
             height="24" 
             viewBox="0 0 38 24" 
             fill="none" 
             xmlns="http://www.w3.org/2000/svg"
             style={{
               transform: liveExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
               transition: 'transform 0.2s ease',
               marginLeft: '8px'
             }}
           >
             <rect x="0.5" y="0.5" width="37" height="23" rx="11.5" stroke="black"/>
             <path d="M18.7642 14.4707C18.8267 14.5332 18.9121 14.5684 19.0005 14.5684C19.0887 14.5683 19.1734 14.5331 19.2358 14.4707L23.5962 10.1094L23.1245 9.63867L19.354 13.4102L19.0005 13.7637L14.8755 9.63867L14.4038 10.1104L18.7642 14.4707Z" fill="black" stroke="black"/>
           </svg>
           )}

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
                 className="hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer"

                 style={{

                   /* Frame 540 */

                   display: 'flex',

                   flexDirection: 'row',

                   alignItems: 'center',

                   padding: '12px',

                   gap: '12px',

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

                     <span 
                       style={{
                       fontFamily: 'Poppins',
                       fontWeight: 600,
                       fontSize: '12px',
                       lineHeight: '18px',
                         color: trialStatus.canClickIntoProfiles ? '#000000' : '#666666',
                         cursor: (trialStatus.canClickIntoProfiles && player.profileId) ? 'pointer' : 'default',
                       }}
                       onClick={(e) => handlePreviewClick(e, player.profileId)}
                       title={trialStatus.canClickIntoProfiles ? "View profile" : "Upgrade to view profiles"}
                     >
                       {player.name}
                       {!trialStatus.canClickIntoProfiles && <span style={{ marginLeft: '4px' }}>🔒</span>}
                     </span>

                     

                     {/* Country and Team */}

                     <div style={{

                       display: 'flex',

                       alignItems: 'center',

                       gap: '6px',

                     }}>

                       {!(player.isAggregated && player.aggregateType === 'team') && player.countryFlag && (
                       <img 

                           src={player.countryFlag || ''}

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
                       )}

                       

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

                   <span 
                     className="hover:scale-110 transition-transform duration-200 ease-in-out"
                     style={{

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

                 <svg 
                   width="24" 
                   height="24" 
                   viewBox="0 0 18 18" 
                   fill="none" 
                   xmlns="http://www.w3.org/2000/svg"
                 >
                   <path d="M4 18V16H8V12.9C7.18333 12.7167 6.45433 12.371 5.813 11.863C5.17167 11.355 4.70067 10.7173 4.4 9.95C3.15 9.8 2.10433 9.25433 1.263 8.313C0.421667 7.37167 0.000666667 6.26733 0 5V4C0 3.45 0.196 2.97933 0.588 2.588C0.98 2.19667 1.45067 2.00067 2 2H4V0H14V2H16C16.55 2 17.021 2.196 17.413 2.588C17.805 2.98 18.0007 3.45067 18 4V5C18 6.26667 17.579 7.371 16.737 8.313C15.895 9.255 14.8493 9.80067 13.6 9.95C13.3 10.7167 12.8293 11.3543 12.188 11.863C11.5467 12.3717 10.8173 12.7173 10 12.9V16H14V18H4ZM4 7.8V4H2V5C2 5.63333 2.18333 6.20433 2.55 6.713C2.91667 7.22167 3.4 7.584 4 7.8ZM9 11C9.83333 11 10.5417 10.7083 11.125 10.125C11.7083 9.54167 12 8.83333 12 8V2H6V8C6 8.83333 6.29167 9.54167 6.875 10.125C7.45833 10.7083 8.16667 11 9 11ZM14 7.8C14.6 7.58333 15.0833 7.22067 15.45 6.712C15.8167 6.20333 16 5.63267 16 5V4H14V7.8Z" 
                     fill="#cccccc"
                   />
                 </svg>

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

      {/* Centered Profile Preview */}
      {selectedProfile && (
        <>
          {/* Subtle backdrop */}
          <div 
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 999
            }}
            onClick={handleClosePreview}
          />
          {/* Centered profile */}
          <div style={{ 
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            maxHeight: '90vh',
            overflow: 'auto',
            maxWidth: '90vw'
          }}>
            <PlyrZeroProfileStandalone 
              profileId={selectedProfile}
              isOpen={true}
              onClose={handleClosePreview}
            />
          </div>
        </>
      )}

    </>

  )

}

