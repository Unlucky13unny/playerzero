import { type ReactNode, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { NotificationBell } from '../common/NotificationBell'
import { Crown } from "../icons/Crown"
import { useMobile } from "../../hooks/useMobile"
import logoSvg from "/images/logo.svg"

type LayoutProps = {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth()
  const trialStatus = useTrialStatus()
  const navigate = useNavigate()
  // const location = useLocation()
  // const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false)
  const isMobile = useMobile()
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
    // setMobileMenuOpen(false)
  }

  const toggleFeaturesDropdown = () => {
    setFeaturesDropdownOpen(!featuresDropdownOpen)
  }

  // const formatTrialTime = () => {
  //   const { timeRemaining } = trialStatus
  //   if (timeRemaining.days > 0) {
  //     return `${timeRemaining.days} day${timeRemaining.days !== 1 ? 's' : ''} remaining`
  //   }
  //   return 'Less than a day remaining'
  // }

  // const isActiveRoute = (path: string) => {
  //   return location.pathname === path
  // }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('features-dropdown')
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setFeaturesDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="app-container" style={{
      width: '100%',
      minWidth: isMobile ? '353px' : 'auto',
      maxWidth: '100vw',
      overflowX: 'hidden',
    }}>
      <header className={`bg-white ${isMobile ? 'p-4' : 'p-4'}`} style={{
        width: '100%',
        minWidth: isMobile ? '353px' : 'auto',
        maxWidth: '100vw',
        position: 'relative',
        overflow: 'visible',
        zIndex: 100,
      }}>
        {isMobile ? (
          // Mobile Header Layout
          <div className="flex items-center justify-between" style={{
            width: '100%',
            minWidth: '337px', // 353px - 2*8px padding
            maxWidth: '100%',
            position: 'relative',
            overflow: 'visible',
          }}>
            <Link to="/UserProfile" className="flex items-center hover:opacity-80 transition-opacity">
              <img 
                src={logoSvg} 
                alt="PlayerZero" 
                style={{
                  width: '93px',
                  height: '16px',
                  /* Inside auto layout */
                  flex: 'none',
                  order: 0,
                  flexGrow: 0
                }}
              />
            </Link>

            {/* Right Side - Same layout as desktop */}
            <div className="flex items-center gap-0">
              {user && (
                <>
                  {!trialStatus.isPaidUser && (
                    <button 
                      onClick={() => navigate('/upgrade')}
                      className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                      title="Upgrade to Premium"
                      style={{ width: '30px', height: '30px' }}
                    >
                      <Crown className="w-4 h-4 text-white" />
                    </button>
                  )}
                  <NotificationBell />
                </>
              )}

              {/* Features Dropdown - Mobile optimized */}
              <div className="relative" id="features-dropdown" style={{ zIndex: 1000 }}>
                <button
                  onClick={toggleFeaturesDropdown}
                  className="p-1 hover:bg-gray-400 cursor-pointer rounded-md transition-colors"
                  title="Menu"
                  style={{ position: 'relative', zIndex: 1001 }}
                >
                  <img src="/images/threelinea.svg" alt="Menu" className="w-11 h-11" />
                </button>

                {featuresDropdownOpen && (
                  <div className="layout-menu-dropdown" style={{ zIndex: 1002 }}>
                    <Link
                      to="/profile?edit=true"
                      onClick={() => setFeaturesDropdownOpen(false)}
                      className="layout-menu-item"
                    >
                      Profile Settings
                    </Link>
                    
                    <Link
                      to="/update-stats"
                      onClick={() => setFeaturesDropdownOpen(false)}
                      className="layout-menu-item"
                    >
                      Update Stats
                    </Link>
                    
                    <Link
                      to="/calculators"
                      onClick={() => setFeaturesDropdownOpen(false)}
                      className="layout-menu-item"
                    >
                      Calculators
                    </Link>

                    <Link
                      to="/search"
                      onClick={() => setFeaturesDropdownOpen(false)}
                      className="layout-menu-item"
                    >
                      Search Users
                    </Link>

                    <Link
                      to="/contact"
                      onClick={() => setFeaturesDropdownOpen(false)}
                      className="layout-menu-item"
                    >
                      Help & Support
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="layout-menu-item"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Desktop Header Layout - Horizontal Layout with Specific Gaps
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            minWidth: '353px',
            height: '48px',
          }}>
            {/* Logo - 179x35 */}
            <Link to="/UserProfile" style={{
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}>
              <img 
                src={logoSvg} 
                alt="PlayerZero" 
                style={{
                  width: '179px',
                  height: '48px',
                }}
              />
            </Link>

            {/* Horizontal Gap - 1269px */}
            <div style={{
              width: '550px',
              height: '1px',
          
              order: 1,
              flexGrow: 0,
            }} />

            {user && (
              <>
                {/* Profile Button */}
                <Link to="/UserProfile" style={{
                  /* profile */
                  boxSizing: 'border-box',
                  /* Auto layout */
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px',
                  gap: '8px',
                  width: '171px',
                  height: '48px',
                  border: '1px solid #DC2627',
                  borderRadius: '12px',
                  /* Inside auto layout */
                  flex: 'none',
                  order: 2,
                  flexGrow: 0,
                  textDecoration: 'none',
                }}>
                  {/* iconamoon:profile */}
                  <div style={{
                    width: '24px',
                    height: '24px',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                    position: 'relative',
                  }}>
                    {/* Profile Icon with vectors */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Vector - Body */}
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" 
                            stroke="#DC2627" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"/>
                      {/* Vector - Head */}
                      <circle cx="12" cy="7" r="4" 
                              stroke="#DC2627" 
                              strokeWidth="2"/>
                    </svg>
                  </div>
                  
                  {/* Profile Text */}
                  <span style={{
                    /* Profile */
                    width: '45px',
                    height: '21px',
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    fontSize: '14px',
                    lineHeight: '21px',
                    /* identical to box height */
                    color: '#DC2627',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 1,
                    flexGrow: 0,
                  }}>
                    Profile
                  </span>
                </Link>

                {/* 8px Gap */}
                <div style={{
                  width: '8px',
                  height: '1px',
                  flex: 'none',
                  order: 3,
                  flexGrow: 0,
                }} />

                {/* Leaderboard Button */}
                <Link to="/leaderboards" style={{
                  /* leaderboard */
                  boxSizing: 'border-box',
                  /* Auto layout */
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px',
                  gap: '8px',
                  width: '171px',
                  height: '48px',
                  border: '1px solid #000000',
                  borderRadius: '12px',
                  /* Inside auto layout */
                  flex: 'none',
                  order: 4,
                  flexGrow: 0,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease-in-out',
                }}
                onMouseEnter={(e) => {
                  const svg = e.currentTarget.querySelector('svg path') as SVGPathElement
                  const text = e.currentTarget.querySelector('span') as HTMLSpanElement
                  if (svg) svg.style.stroke = '#DC2627'
                  if (text) text.style.color = '#DC2627'
                }}
                onMouseLeave={(e) => {
                  const svg = e.currentTarget.querySelector('svg path') as SVGPathElement
                  const text = e.currentTarget.querySelector('span') as HTMLSpanElement
                  if (svg) svg.style.stroke = '#000000'
                  if (text) text.style.color = '#000000'
                }}>
                  {/* iconoir:leaderboard-star */}
                  <div style={{
                    width: '24px',
                    height: '24px',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                    position: 'relative',
                  }}>
                    {/* Vector */}
                    <svg 
                      width="24" 
                      height="24" 
                      viewBox="0 0 6 6" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        position: 'absolute',
                        left: '12.5%',
                        right: '12.5%',
                        top: '12.5%',
                        bottom: '12.5%',
                      }}
                    >
                      <path d="M3.78575 5.42857H2.07146M3.78575 5.42857V3.02857C3.78575 2.9831 3.76769 2.9395 3.73554 2.90735C3.70339 2.8752 3.65979 2.85714 3.61432 2.85714H2.24289C2.19743 2.85714 2.15382 2.8752 2.12167 2.90735C2.08952 2.9395 2.07146 2.9831 2.07146 3.02857V5.42857M3.78575 5.42857H5.32861C5.37407 5.42857 5.41768 5.41051 5.44982 5.37836C5.48197 5.34621 5.50003 5.30261 5.50003 5.25714V4.6C5.50003 4.55453 5.48197 4.51093 5.44982 4.47878C5.41768 4.44663 5.37407 4.42857 5.32861 4.42857H3.95718C3.91171 4.42857 3.86811 4.44663 3.83596 4.47878C3.80381 4.51093 3.78575 4.55453 3.78575 4.6V5.42857ZM2.07146 5.42857V4.02857C2.07146 3.9831 2.0534 3.9395 2.02125 3.90735C1.9891 3.8752 1.9455 3.85714 1.90003 3.85714H0.528606C0.483141 3.85714 0.439537 3.8752 0.407388 3.90735C0.375239 3.9395 0.357178 3.9831 0.357178 4.02857V5.25714C0.357178 5.30261 0.375239 5.34621 0.407388 5.37836C0.439537 5.41051 0.483141 5.42857 0.528606 5.42857H2.07146ZM2.58746 0.889428L2.84718 0.338856C2.85419 0.323117 2.86561 0.309747 2.88006 0.300364C2.89451 0.290981 2.91138 0.285988 2.92861 0.285988C2.94584 0.285988 2.9627 0.290981 2.97715 0.300364C2.9916 0.309747 3.00302 0.323117 3.01003 0.338856L3.27003 0.889428L3.85061 0.978285C3.92518 0.989713 3.95489 1.08571 3.90089 1.14057L3.48089 1.56914L3.58003 2.17428C3.59261 2.252 3.51489 2.31143 3.44803 2.27457L2.92861 1.98886L2.40918 2.27457C2.34261 2.31114 2.26461 2.252 2.27718 2.17428L2.37632 1.56914L1.95632 1.14057C1.90203 1.08571 1.93203 0.989713 2.00632 0.978285L2.58746 0.889428Z" 
                            stroke="#000000" 
                            strokeWidth="0.428571" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  
                  {/* Leaderboard Text */}
                  <span style={{
                    /* Leaderboard */
                    width: '92px',
                    height: '21px',
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    fontSize: '14px',
                    lineHeight: '21px',
                    /* identical to box height */
                    color: '#000000',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 1,
                    flexGrow: 0,
                  }}>
                    Leaderboard
                  </span>
                </Link>

                {/* 24px Gap */}
                <div style={{
                  width: '24px',
                  height: '1px',
                  flex: 'none',
                  order: 5,
                  flexGrow: 0,
                }} />

                {/* Icons Section */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '0px',
                  flex: 'none',
                  order: 6,
                  flexGrow: 0,
                }}>
                  {/* Upgrade Button */}
                  {!trialStatus.isPaidUser && (
                    <button 
                      onClick={() => navigate('/upgrade')}
                      style={{
                        width: '30px',
                        height: '30px',
                        background: '#DC2627',
                        borderRadius: '1000px',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flex: 'none',
                        order: 0,
                        flexGrow: 0,
                      }}
                      title="Upgrade to Premium"
                    >
                      <Crown className="w-4 h-4 text-white" />
                    </button>
                  )}
                  
                  {/* Notification Bell */}
                  <NotificationBell />
                </div>

                {/* Features Dropdown */}
                <div className="relative" id="features-dropdown" style={{
                  flex: 'none',
                  order: 7,
                  flexGrow: 0,
                  marginLeft: '8px'
                }}>
                  <button
                    onClick={toggleFeaturesDropdown}
                    className="p-1 hover:bg-gray-400 cursor-pointer rounded-md transition-colors"
                    title="Menu"
                  >
                    <img src="/images/threelinea.svg" alt="Menu" className="w-11 h-11" />
                  </button>

                  {featuresDropdownOpen && (
                    <div className="layout-menu-dropdown">
                      <Link
                        to="/profile?edit=true"
                        onClick={() => setFeaturesDropdownOpen(false)}
                        className="layout-menu-item"
                      >
                        Profile Settings
                      </Link>
                      
                      <Link
                        to="/update-stats"
                        onClick={() => setFeaturesDropdownOpen(false)}
                        className="layout-menu-item"
                      >
                        Update Stats
                      </Link>
                      
                      <Link
                        to="/calculators"
                        onClick={() => setFeaturesDropdownOpen(false)}
                        className="layout-menu-item"
                      >
                        Calculators
                      </Link>

                      <Link
                        to="/search"
                        onClick={() => setFeaturesDropdownOpen(false)}
                        className="layout-menu-item"
                      >
                        Search Users
                      </Link>

                      <Link
                        to="/contact"
                        onClick={() => setFeaturesDropdownOpen(false)}
                        className="layout-menu-item"
                      >
                        Help & Support
                      </Link>

                      <button
                        onClick={handleSignOut}
                        className="layout-menu-item"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </header>

      <main className="main-content" style={{
        width: '100%',
        minWidth: isMobile ? '353px' : 'auto',
        maxWidth: '100vw',
        overflowX: 'hidden',
      }}>
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <div className="bottom-nav mobile-only" style={{
          width: '100%',
          minWidth: '353px',
          maxWidth: '100vw',
        }}>
          {/* Mobile navigation content would go here */}
        </div>
      )}
    </div>
  )
}