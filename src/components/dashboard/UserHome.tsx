import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { PerformanceRadarChart } from './RadarChart';
import { ExportCardModal } from './ExportCardModal';
import { type ProfileWithMetadata } from '../../services/profileService';
import { useTrialStatus } from '../../hooks/useTrialStatus';
import { FaDownload } from 'react-icons/fa';
import { PlayerProfile } from './PlayerProfile';
import { WelcomeModal } from '../common/WelcomeModal';
import { dashboardService } from '../../services/dashboardService';

// Styles for the new layout
const chartStyles = {
  chartsContainer: {
    display: "flex",
    gap: "2rem",
    alignItems: "stretch",
    marginTop: "2rem",
    flexDirection: "row" as const
  },
  chartSection: {
    width: "50%",
    display: "flex",
    flexDirection: "column" as const
  },
  mobileChartsContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2rem",
    marginTop: "2rem"
  },
  mobileChartSection: {
    width: "100%",
    display: "flex",
    flexDirection: "column" as const
  },
  grindChartTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
    border: "1px solid #374151",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
    flex: "1",
    display: "flex",
    flexDirection: "column" as const,
    backgroundColor: "#111827"
  },
  grindChartHeader: {
    backgroundColor: "#1f2937",
    padding: "0.75rem",
    borderBottom: "2px solid #374151"
  },
  buttonContainer: {
    display: "flex",
    gap: "0.5rem",
    width: "100%"
  },
  timeFilterButton: {
    padding: "0.5rem 1rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#374151",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    flex: "1"
  },
  timeFilterButtonActive: {
    padding: "0.5rem 1rem",
    border: "1px solid #dc267f",
    borderRadius: "8px",
    backgroundColor: "#dc267f",
    color: "#ffffff",
    fontSize: "0.875rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px 0 rgba(220, 38, 127, 0.2)",
    flex: "1"
  },
  exportChartButton: {
    padding: "0.5rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    flex: "1"
  },
  mobileTimeFilterButton: {
    padding: "0.4rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    color: "#374151",
    fontSize: "0.75rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    flex: "1"
  },
  mobileTimeFilterButtonActive: {
    padding: "0.4rem 0.75rem",
    border: "1px solid #dc267f",
    borderRadius: "6px",
    backgroundColor: "#dc267f",
    color: "#ffffff",
    fontSize: "0.75rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px 0 rgba(220, 38, 127, 0.2)",
    flex: "1"
  },
  mobileExportChartButton: {
    padding: "0.4rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    flex: "1"
  },
  grindLabel: {
    padding: "0.5rem 1rem",
    borderBottom: "1px solid #374151",
    textAlign: "left" as const,
    fontWeight: "600",
    color: "#d1d5db",
    backgroundColor: "#1f2937",
    fontSize: "0.8rem",
    flex: "1",
    display: "flex",
    alignItems: "center",
    minHeight: "32px",
    transition: "background-color 0.2s ease"
  },
  grindValue: {
    padding: "0.5rem 1rem",
    borderBottom: "1px solid #374151",
    textAlign: "left" as const,
    fontWeight: "700",
    color: "#f9fafb",
    backgroundColor: "#111827",
    fontSize: "0.9rem",
    flex: "1",
    display: "flex",
    alignItems: "center",
    minHeight: "32px",
    transition: "background-color 0.2s ease"
  }
};


// Keep for potential future use
// const TEAM_COLORS = {
//   blue: { name: 'Blue', color: '#0074D9', icon: '❄️' },
//   red: { name: 'Red', color: '#FF4136', icon: '🔥' },
//   yellow: { name: 'Yellow', color: '#FFDC00', icon: '⚡' },
//   black: { name: 'Black', color: '#111111', icon: '⚫' },
//   green: { name: 'Green', color: '#2ECC40', icon: '🌿' },
//   orange: { name: 'Orange', color: '#FF851B', icon: '🔸' },
//   purple: { name: 'Purple', color: '#B10DC9', icon: '💜' },
//   pink: { name: 'Pink', color: '#F012BE', icon: '💗' }
// };

export const UserHome = () => {
  const { user } = useAuth();
  const location = useLocation();
  const trialStatus = useTrialStatus();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProfileWithMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [activeTimeFilter, setActiveTimeFilter] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
  const [filteredStats, setFilteredStats] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Check if user is coming from profile setup
  useEffect(() => {
    const isFromSetup = location.state?.fromProfileSetup;
    if (isFromSetup) {
      setShowWelcomeModal(true);
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (!hasLoaded) {
      loadUserStats();
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  useEffect(() => {
    loadFilteredStats();
  }, [activeTimeFilter, stats]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setStats(data);
    } catch (err: any) {
      console.error('Error loading user stats:', err);
      setError('Failed to load your stats. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredStats = async () => {
    if (!stats || !user?.id) return;

    try {
      let filteredData: any = {};

      switch (activeTimeFilter) {
        case 'weekly':
          try {
            // Use the new current week calculation (Sunday-Saturday UTC)
            const weekStats = await dashboardService.calculateCurrentWeekGrindStats(user.id);
            filteredData = {
              distance_walked: Math.round(weekStats.distanceWalked * 10) / 10, // One decimal place
              pokemon_caught: Math.round(weekStats.pokemonCaught), // Whole number
              pokestops_visited: Math.round(weekStats.pokestopsVisited), // Whole number
              total_xp: Math.round(weekStats.totalXP) // Whole number
            };
          } catch (weekError) {
            console.error('Error loading weekly stats:', weekError);
            // Fallback to zeros if error
            filteredData = {
              distance_walked: 0,
              pokemon_caught: 0,
              pokestops_visited: 0,
              total_xp: 0
            };
          }
          break;
        case 'monthly':
          try {
            // Use the new current month calculation
            const monthStats = await dashboardService.calculateCurrentMonthGrindStats(user.id);
            filteredData = {
              distance_walked: Math.round(monthStats.distanceWalked * 10) / 10, // One decimal place
              pokemon_caught: Math.round(monthStats.pokemonCaught), // Whole number
              pokestops_visited: Math.round(monthStats.pokestopsVisited), // Whole number
              total_xp: Math.round(monthStats.totalXP) // Whole number
            };
          } catch (monthError) {
            console.error('Error loading monthly stats:', monthError);
            // Fallback to zeros if error
            filteredData = {
              distance_walked: 0,
              pokemon_caught: 0,
              pokestops_visited: 0,
              total_xp: 0
            };
          }
          break;
        case 'all-time':
          filteredData = {
            distance_walked: stats.distance_walked || 0,
            pokemon_caught: stats.pokemon_caught || 0,
            pokestops_visited: stats.pokestops_visited || 0,
            total_xp: stats.total_xp || 0
          };
          break;
        default:
          filteredData = {
            distance_walked: stats.distance_walked || 0,
            pokemon_caught: stats.pokemon_caught || 0,
            pokestops_visited: stats.pokestops_visited || 0,
            total_xp: stats.total_xp || 0
          };
      }

      setFilteredStats(filteredData);
    } catch (err: any) {
      console.error('Error loading filtered stats:', err);
      setFilteredStats(stats); // Fallback to current stats
    }
  };

  const formatNumber = (num: number | null | undefined, decimals?: number) => {
    if (num == null) return '0';
    if (decimals !== undefined) {
      return new Intl.NumberFormat('en-US', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
      }).format(num);
    }
    return new Intl.NumberFormat().format(num);
  };

  const calculateDailyAverage = (totalValue: number | null | undefined, startDate: string | null | undefined) => {
    if (!totalValue || !startDate) return 0;
    
    const start = new Date(startDate);
    const now = new Date();
    const daysSinceStart = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    return totalValue / daysSinceStart;
  };

  const formatDailyAverage = (totalValue: number | null | undefined, startDate: string | null | undefined, isDistance: boolean = false) => {
    const dailyAverage = calculateDailyAverage(totalValue, startDate);
    
    if (isDistance) {
      // Round to nearest tenth (1 decimal place)
      return `${Math.round(dailyAverage * 10) / 10} km`;
    }
    
    // For XP, convert to K before rounding if >= 1000
    if (dailyAverage >= 1000) {
      const xpInK = dailyAverage / 1000;
      return `${Math.round(xpInK * 10) / 10}K`;
    }
    
    // Round to nearest tenth for other values
    return Math.round(dailyAverage * 10) / 10;
  };



  // Keep for potential future use
  // const getTeamColor = (teamColor: string) => {
  //   switch (teamColor?.toLowerCase()) {
  //     case 'valor':
  //     case 'red':
  //       return '#FF4444';
  //     case 'mystic':
  //     case 'blue':
  //       return '#4444FF';
  //     case 'instinct':
  //     case 'yellow':
  //       return '#FFAA00';
  //     default:
  //       return '#888888';
  //   }
  // };



  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%' }}>
        <p style={{ fontSize: '16px', color: '#636874', fontWeight: 500, textAlign: 'center' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-home-container">
        <div className="error-message">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Keep for potential future use
  // const teamInfo = stats?.team_color ? TEAM_COLORS[stats.team_color as keyof typeof TEAM_COLORS] : null;

  return (
    <div>
      <WelcomeModal 
        isOpen={showWelcomeModal}
        onContinue={() => setShowWelcomeModal(false)}
        userName={stats?.trainer_name}
      />
      
      {/* Use the new PlayerProfile component with proper design */}
      <PlayerProfile 
        viewMode="own" 
        userType={trialStatus.isPaidUser ? "upgraded" : "trial"} 
        showHeader={false}
      />

      {/* Keep the existing banner and original layout for functionality that needs to be preserved */}
      <div className="user-home-container" style={{ display: 'none' }}>
      {/* Private Mode Banner */}
      {!trialStatus.isPaidUser && !trialStatus.loading && (
        <div className={`private-mode-banner ${trialStatus.isInTrial ? 'active' : 'expired'}`}>
          <div className="private-mode-content">
            {trialStatus.isInTrial ? (
              <p className="private-mode-status">
                Private Mode: {trialStatus.timeRemaining.days} day{trialStatus.timeRemaining.days !== 1 ? 's' : ''} remaining
              </p>
            ) : (
              <p className="private-mode-status">
                Private Mode Ended - To keep tracking your grind and unlock your leaderboard placement, upgrade for $5.99.
                <button 
                  className="upgrade-button"
                  onClick={() => window.location.href = '/upgrade'}
                >
                  Upgrade Now
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="section-header">
        <h1>Welcome Back, Trainer!</h1>
      </div>

      {/* Profile Header - Side by Side Layout */}
      <div className="profile-card-container" style={{ 
        display: "flex", 
        gap: "2rem", 
        alignItems: "flex-start",
        ...(isMobile && {
          flexDirection: "column",
          gap: "1.5rem",
          padding: "1rem",
          width: "100%",
          overflow: "hidden"
        })
      }}>
        
        {/* Profile Card - Left Side */}
        <div style={{ flex: "1" }}>
          {/* We'll keep the original ProfileCard component for now but hidden */}
        </div>

        {/* Stats Table - Right Side */}
        <table className="stats-table" style={{ 
          width: "50%", 
          borderCollapse: "collapse",
          ...(isMobile && {
            width: "100%",
            fontSize: "0.75rem",
            minWidth: "0",
            tableLayout: "fixed",
            overflow: "hidden"
          })
        }}>
          {/* Row 1: Grind Chart Header */}
          <thead>
            <tr>
              <th colSpan={4} className="grind-chart-header">
                Grind Chart
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Row 2: Column Headers */}
            <tr>
              <th className="stat-value" style={{ 
                padding: isMobile ? "0.5rem 0.25rem" : "1rem", 
                textAlign: "center", 
                fontWeight: "600", 
                fontSize: isMobile ? "0.7rem" : "0.875rem",
                wordBreak: "break-word"
              }}>KM</th>
              <th className="stat-value" style={{ 
                padding: isMobile ? "0.5rem 0.25rem" : "1rem", 
                textAlign: "center", 
                fontWeight: "600", 
                fontSize: isMobile ? "0.7rem" : "0.875rem",
                wordBreak: "break-word"
              }}>CAUGHT</th>
              <th className="stat-value" style={{ 
                padding: isMobile ? "0.5rem 0.25rem" : "1rem", 
                textAlign: "center", 
                fontWeight: "600", 
                fontSize: isMobile ? "0.7rem" : "0.875rem",
                wordBreak: "break-word"
              }}>STOPS</th>
              <th className="stat-value" style={{ 
                padding: isMobile ? "0.5rem 0.25rem" : "1rem", 
                textAlign: "center", 
                fontWeight: "600", 
                fontSize: isMobile ? "0.7rem" : "0.875rem",
                wordBreak: "break-word"
              }}>XP</th>
            </tr>
            {/* Row 3: Values */}
            <tr>
              <td className="stat-value" style={{ 
                padding: isMobile ? "0.5rem 0.25rem" : "1rem", 
                textAlign: "center", 
                fontWeight: "700", 
                fontSize: isMobile ? "0.8rem" : "1rem",
                wordBreak: "break-word"
              }}>{formatDailyAverage(stats?.distance_walked, stats?.start_date, true)}</td>
              <td className="stat-value" style={{ 
                padding: isMobile ? "0.5rem 0.25rem" : "1rem", 
                textAlign: "center", 
                fontWeight: "700", 
                fontSize: isMobile ? "0.8rem" : "1rem",
                wordBreak: "break-word"
              }}>{formatDailyAverage(stats?.pokemon_caught, stats?.start_date)}</td>
              <td className="stat-value" style={{ 
                padding: isMobile ? "0.5rem 0.25rem" : "1rem", 
                textAlign: "center", 
                fontWeight: "700", 
                fontSize: isMobile ? "0.8rem" : "1rem",
                wordBreak: "break-word"
              }}>{formatDailyAverage(stats?.pokestops_visited, stats?.start_date)}</td>
              <td className="stat-value" style={{ 
                padding: isMobile ? "0.5rem 0.25rem" : "1rem", 
                textAlign: "center", 
                fontWeight: "700", 
                fontSize: isMobile ? "0.8rem" : "1rem",
                wordBreak: "break-word"
              }}>{formatDailyAverage(stats?.total_xp, stats?.start_date)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Charts Section - Responsive Layout */}
      {isMobile ? (
        <div style={chartStyles.mobileChartsContainer}>
          {/* Grind Chart - Mobile First */}
          <div style={chartStyles.mobileChartSection}>
            <div style={chartStyles.grindChartTable}>
              {/* Header with buttons */}
              <div style={chartStyles.grindChartHeader}>
                <div style={chartStyles.buttonContainer}>
                  <button 
                    style={activeTimeFilter === 'weekly' ? chartStyles.mobileTimeFilterButtonActive : chartStyles.mobileTimeFilterButton}
                    onClick={() => setActiveTimeFilter('weekly')}
                  >
                    Week
                  </button>
                  <button 
                    style={activeTimeFilter === 'monthly' ? chartStyles.mobileTimeFilterButtonActive : chartStyles.mobileTimeFilterButton}
                    onClick={() => setActiveTimeFilter('monthly')}
                  >
                    Month
                  </button>
                  <button 
                    style={activeTimeFilter === 'all-time' ? chartStyles.mobileTimeFilterButtonActive : chartStyles.mobileTimeFilterButton}
                    onClick={() => setActiveTimeFilter('all-time')}
                  >
                    All Time
                  </button>
                  <button 
                    style={chartStyles.mobileExportChartButton}
                    onClick={() => setShowExportModal(true)}
                    disabled={!trialStatus.isPaidUser && !trialStatus.isInTrial}
                    title="Export Chart"
                  >
                    <FaDownload />
                  </button>
                </div>
              </div>
              
              {/* Content area with flex distribution */}
              <div style={{ 
                flex: "1", 
                display: "flex", 
                flexDirection: "column",
                backgroundColor: "#111827"
              }}>
                {/* Distance */}
                <div 
                  style={chartStyles.grindLabel}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                >
                  Distance Walked
                </div>
                <div 
                  style={chartStyles.grindValue}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#111827";
                  }}
                >
                  {activeTimeFilter === 'weekly' || activeTimeFilter === 'monthly' 
                    ? formatNumber(filteredStats?.distance_walked || 0, 1) 
                    : formatNumber(filteredStats?.distance_walked || stats?.distance_walked)} km
                </div>
                
                {/* Pokémon Caught */}
                <div 
                  style={chartStyles.grindLabel}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                >
                  Pokémon Caught
                </div>
                <div 
                  style={chartStyles.grindValue}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#111827";
                  }}
                >
                  {formatNumber(filteredStats?.pokemon_caught || stats?.pokemon_caught)}
                </div>
                
                {/* Pokéstops Visited */}
                <div 
                  style={chartStyles.grindLabel}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                >
                  Pokéstops Visited
                </div>
                <div 
                  style={chartStyles.grindValue}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#111827";
                  }}
                >
                  {formatNumber(filteredStats?.pokestops_visited || stats?.pokestops_visited)}
                </div>
                
                {/* Total XP */}
                <div 
                  style={chartStyles.grindLabel}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                >
                  Total XP
                </div>
                <div 
                  style={chartStyles.grindValue}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#111827";
                  }}
                >
                  {formatNumber(filteredStats?.total_xp || stats?.total_xp)}
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart - Mobile Second */}
          <div style={chartStyles.mobileChartSection}>
            <div className="radar-chart-container" style={{
              width: 300,
              minWidth: 300,
              maxWidth: 300,
              height: 300,
              minHeight: 300,
              maxHeight: 300,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
              padding: '1rem',
              boxSizing: 'border-box',
              flexShrink: 0,
              flexGrow: 0,
            }}>
              <h2 style={{ 
                marginBottom: "1rem", 
                color: "#f9fafb",
                fontSize: "1.25rem",
                fontWeight: "600"
              }}>Performance Overview</h2>
          <PerformanceRadarChart
            profile={stats}
            isPaidUser={trialStatus.isPaidUser}
            showHeader={false}
          />
        </div>
      </div>
      </div>
      ) : (
        <div style={chartStyles.chartsContainer}>
          {/* Grind Chart - Left Side (Desktop) */}
          <div style={chartStyles.chartSection}>
            <div style={chartStyles.grindChartTable}>
              {/* Header with buttons */}
              <div style={chartStyles.grindChartHeader}>
                <div style={chartStyles.buttonContainer}>
                  <button 
                    style={activeTimeFilter === 'weekly' ? chartStyles.timeFilterButtonActive : chartStyles.timeFilterButton}
                    onClick={() => setActiveTimeFilter('weekly')}
                  >
                    Week
                  </button>
                  <button 
                    style={activeTimeFilter === 'monthly' ? chartStyles.timeFilterButtonActive : chartStyles.timeFilterButton}
                    onClick={() => setActiveTimeFilter('monthly')}
                  >
                    Month
                  </button>
                  <button 
                    style={activeTimeFilter === 'all-time' ? chartStyles.timeFilterButtonActive : chartStyles.timeFilterButton}
                    onClick={() => setActiveTimeFilter('all-time')}
                  >
                    All Time
                  </button>
          <button 
                    style={chartStyles.exportChartButton}
            onClick={() => setShowExportModal(true)}
            disabled={!trialStatus.isPaidUser && !trialStatus.isInTrial}
                    title="Export Chart"
          >
            <FaDownload />
          </button>
                </div>
              </div>
              
              {/* Content area with flex distribution */}
              <div style={{ 
                flex: "1", 
                display: "flex", 
                flexDirection: "column",
                backgroundColor: "#111827"
              }}>
                {/* Distance */}
                <div 
                  style={chartStyles.grindLabel}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                >
                  Distance Walked
                </div>
                <div 
                  style={chartStyles.grindValue}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#111827";
                  }}
                >
                  {activeTimeFilter === 'weekly' || activeTimeFilter === 'monthly' 
                    ? formatNumber(filteredStats?.distance_walked || 0, 1) 
                    : formatNumber(filteredStats?.distance_walked || stats?.distance_walked)} km
                </div>
                
                {/* Pokémon Caught */}
                <div 
                  style={chartStyles.grindLabel}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                >
                  Pokémon Caught
                </div>
                <div 
                  style={chartStyles.grindValue}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#111827";
                  }}
                >
                  {formatNumber(filteredStats?.pokemon_caught || stats?.pokemon_caught)}
                </div>
                
                {/* Pokéstops Visited */}
                <div 
                  style={chartStyles.grindLabel}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                >
                  Pokéstops Visited
                </div>
                <div 
                  style={chartStyles.grindValue}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#111827";
                  }}
                >
                  {formatNumber(filteredStats?.pokestops_visited || stats?.pokestops_visited)}
                </div>
                
                {/* Total XP */}
                <div 
                  style={chartStyles.grindLabel}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                >
                  Total XP
                </div>
                <div 
                  style={chartStyles.grindValue}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f2937";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#111827";
                  }}
                >
                  {formatNumber(filteredStats?.total_xp || stats?.total_xp)}
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart - Right Side (Desktop) */}
          <div style={chartStyles.chartSection}>
            <div className="radar-chart-container" style={{
              width: 500,
              minWidth: 500,
              maxWidth: 500,
              height: 384,
              minHeight: 384,
              maxHeight: 384,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
              padding: '1.5rem',
              boxSizing: 'border-box',
              flexShrink: 0,
              flexGrow: 0,
            }}>
              <h2 style={{ 
                marginBottom: "1.5rem", 
                color: "#f9fafb",
                fontSize: "1.5rem",
                fontWeight: "600"
              }}>Performance Overview</h2>
              <PerformanceRadarChart
                profile={stats}
                isPaidUser={trialStatus.isPaidUser}
                showHeader={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Export Card Modal */}
      <ExportCardModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        profile={stats}
        isPaidUser={!!stats?.is_paid_user}
      />
      </div>
    </div>
  );
}; 