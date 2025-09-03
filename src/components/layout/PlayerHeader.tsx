import { Link, useNavigate } from "react-router-dom"
import { useMobile } from "../../hooks/useMobile"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { NotificationBell } from "../common/NotificationBell"
import logoSvg from "/images/logo.svg"

interface PlayerHeaderProps {
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
    <header className="bg-white border-b border-gray-200" style={{ 
      position: 'relative',
      minHeight: '108px', // 30px top + 48px height + 30px bottom
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 0',
      width: '100%',
      minWidth: isMobile ? '353px' : 'auto',
    }}>
      {/* Frame 527 - Main Header Container */}
      <div style={{
        /* Frame 527 */
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isMobile ? '0px 8px' : '0px 123px', // Responsive padding
        gap: isMobile ? '16px' : '147px',
        width: '100%',
        minWidth: isMobile ? '353px' : 'auto',
        maxWidth: isMobile ? '100vw' : '1515px', // Responsive maxWidth
        height: '48px',
        position: 'relative', // Change from absolute to relative
      }}>
        
        {/* Layer_1 - Logo */}
        <div style={{
          /* Layer_1 */
          width: isMobile ? '120px' : '179px',
          height: isMobile ? '24px' : '35px',
          /* Inside auto layout */
          flex: 'none',
          order: 0,
          flexGrow: 0,
          position: 'relative',
        }}>
          <Link to="/UserProfile" className="hover:opacity-80 transition-opacity" style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}>
            {/* Clip path group */}
            <div style={{
              position: 'absolute',
              left: '0%',
              right: '0%',
              top: '0%',
              bottom: '0%',
            }}>
              {/* Vector */}
              <div style={{
                position: 'absolute',
                left: '0%',
                right: '0%',
                top: '0%',
                bottom: '0%',
                background: '#000000',
              }}>
          <img 
            src={logoSvg} 
            alt="PlayerZero" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
            </div>
        </Link>
      </div>

        {/* Frame 560 - Middle Section */}
        {!isMobile && (
          <div style={{
            /* Frame 560 */
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0px',
            gap: '24px',
            width: '504px',
            height: '48px',
            /* Inside auto layout */
            flex: 'none',
            order: 1,
            flexGrow: 0,
          }}>
          
          {/* Frame 549 - Button Container */}
          {(showProfileButton || showLeaderboardButton) && (
            <div style={{
              /* Frame 549 */
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: '0px',
              gap: '24px',
              width: '350px',
              height: '48px',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}>
              
              {/* Frame 565 - Buttons */}
              <div style={{
                /* Frame 565 */
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0px',
                gap: '8px',
                width: '350px',
                height: '48px',
                /* Inside auto layout */
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                
                {/* Profile Button */}
            {showProfileButton && (
                  <Link to="/UserProfile" style={{ textDecoration: 'none' }}>
                    <div style={{
                      /* profile */
                      boxSizing: 'border-box',
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
                      order: 0,
                      flexGrow: 0,
                      cursor: 'pointer',
                      background: 'transparent',
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
                        {/* Group */}
                        <div style={{
                          position: 'absolute',
                          left: '16.67%',
                          right: '16.67%',
                          top: '16.67%',
                          bottom: '16.67%',
                        }}>
                          {/* Vector 1 */}
                          <div style={{
                            position: 'absolute',
                            left: '16.67%',
                            right: '16.67%',
                            top: '58.33%',
                            bottom: '16.67%',
                            border: '2px solid #DC2627',
                          }} />
                          {/* Vector 2 */}
                          <div style={{
                            position: 'absolute',
                            left: '37.5%',
                            right: '37.5%',
                            top: '16.67%',
                            bottom: '58.33%',
                            border: '2px solid #DC2627',
                          }} />
                        </div>
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
                        color: '#DC2627',
                        /* Inside auto layout */
                        flex: 'none',
                        order: 1,
                        flexGrow: 0,
                      }}>
                  Profile
                      </span>
                    </div>
              </Link>
            )}
                
                {/* Leaderboard Button */}
            {showLeaderboardButton && (
                  <Link to="/leaderboards" style={{ textDecoration: 'none' }}>
                    <div style={{
                      /* leaderboard */
                      boxSizing: 'border-box',
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
                      order: 1,
                      flexGrow: 0,
                      cursor: 'pointer',
                      background: 'transparent',
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
                        color: '#000000',
                        /* Inside auto layout */
                        flex: 'none',
                        order: 1,
                        flexGrow: 0,
                      }}>
                  Leaderboard
                      </span>
                    </div>
              </Link>
            )}
              </div>
            </div>
          )}
          </div>
        )}

        {/* Frame 20 - Icon Section (Already implemented) */}
        <div style={{
          /* Frame 20 */
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '0px',
          gap: '8px',
          width: isMobile ? 'auto' : '109px',
          height: '45px',
          /* Inside auto layout */
          flex: 'none',
          order: 2,
          flexGrow: 0,
        }}>
          {/* Crown Upgrade Badge */}
          {userType === "trial" && (
          <button 
            onClick={handleUpgrade}
            style={{
                /* material-symbols:crown-outline */
                width: '30px',
                height: '30px',
                background: '#DC2627',
                borderRadius: '1000px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                position: 'relative',
                /* Inside auto layout */
                flex: 'none',
                order: 0,
                flexGrow: 0,
            }}
            title="Upgrade to Premium"
          >
              {/* Vector */}
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
                position: 'absolute',
                left: '15.79%',
                right: '15.79%',
                top: '15.57%',
                bottom: '23.9%',
              }}>
                <path d="M7.81576 22.8288V20.8112H22.1842V22.8288H7.81576ZM7.81576 19.2981L6.50721 11.2027C6.473 11.2027 6.43434 11.2071 6.39124 11.2158C6.34813 11.2246 6.30982 11.2286 6.27629 11.2279C5.84866 11.2279 5.48534 11.0806 5.18634 10.7861C4.88734 10.4915 4.7375 10.1344 4.73682 9.7148C4.73613 9.29511 4.88598 8.93801 5.18634 8.64344C5.48671 8.34888 5.85003 8.2016 6.27629 8.2016C6.70255 8.2016 7.06621 8.34888 7.36726 8.64344C7.66832 8.93801 7.81782 9.29511 7.81576 9.7148C7.81576 9.8324 7.80276 9.9417 7.77676 10.0426C7.75076 10.1435 7.721 10.236 7.68748 10.32L10.8947 11.7323L14.1019 7.4198C13.9138 7.2853 13.7598 7.10877 13.6401 6.8902C13.5204 6.67163 13.4605 6.43625 13.4605 6.18406C13.4605 5.76374 13.6103 5.4063 13.91 5.11173C14.2097 4.81717 14.573 4.67023 15 4.6709C15.4269 4.67157 15.7906 4.81885 16.0909 5.11274C16.3913 5.40663 16.5408 5.76374 16.5394 6.18406C16.5394 6.43625 16.4796 6.67163 16.3598 6.8902C16.2401 7.10877 16.0862 7.2853 15.898 7.4198L19.1052 11.7323L22.3125 10.32C22.2783 10.236 22.2482 10.1435 22.2222 10.0426C22.1962 9.9417 22.1835 9.8324 22.1842 9.7148C22.1842 9.29444 22.334 8.937 22.6337 8.64244C22.9334 8.34787 23.2967 8.20093 23.7236 8.2016C24.1506 8.20227 24.5143 8.34956 24.8146 8.64344C25.115 8.93733 25.2645 9.29444 25.2631 9.7148C25.2618 10.1351 25.1123 10.4925 24.8146 10.7871C24.517 11.0816 24.1533 11.2286 23.7236 11.2279C23.6894 11.2279 23.6511 11.2239 23.6087 11.2158C23.5663 11.2077 23.5276 11.2034 23.4927 11.2027L22.1842 19.2981H7.81576ZM9.5605 17.2805H20.4394L21.1065 13.0689L18.4125 14.229L15 9.6139L11.5875 14.229L8.8934 13.0689L9.5605 17.2805Z" fill="#EFEFEF"/>
            </svg>
          </button>
        )}

          {/* Notification Bell */}
          {user && (
            <div style={{
              /* notification */
              width: '45px',
              height: '45px',
              position: 'relative',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              {/* Rectangle 13 */}
              <div style={{
                position: 'absolute',
                left: '0%',
                right: '0%',
                top: '0%',
                bottom: '0%',
                borderRadius: '14px',
                background: 'rgba(220, 38, 39, 0.05)',
                border: '2px solid #DC2627',
              }} />
              
              {/* Group - Bell vectors */}
              <div style={{
                position: 'absolute',
                left: '27.05%',
                right: '29.91%',
                top: '24.44%',
                bottom: '24.44%',
              }}>
                {/* Vector 1 */}
                <div style={{
                  position: 'absolute',
                  left: '48.57%',
                  right: '51.43%',
                  top: '24.44%',
                  bottom: '70.18%',
                  background: 'rgba(220, 38, 39, 0.05)',
                  border: '2px solid #DC2627',
                }} />
                {/* Vector 2 */}
                <div style={{
                  position: 'absolute',
                  left: '27.05%',
                  right: '29.91%',
                  top: '29.82%',
                  bottom: '32.51%',
                  background: 'rgba(220, 38, 39, 0.05)',
                  border: '2px solid #DC2627',
                }} />
                {/* Vector 3 */}
                <div style={{
                  position: 'absolute',
                  left: '43.19%',
                  right: '46.05%',
                  top: '70.18%',
                  bottom: '24.44%',
                  background: 'rgba(220, 38, 39, 0.05)',
                  border: '2px solid #DC2627',
                }} />
              </div>
              
              <NotificationBell />
            </div>
          )}

          {/* Hamburger Menu */}
          <div style={{
            /* menu-hamburger */
            width: '45px',
            height: '45px',
            position: 'relative',
            /* Inside auto layout */
            flex: 'none',
            order: 2,
            flexGrow: 0,
          }}>
            {/* Line 1 */}
            <div style={{
              position: 'absolute',
              left: '28.72%',
              right: '28.72%',
              top: '35.35%',
              bottom: '64.65%',
              border: '2.91875px solid #000000',
            }} />
            {/* Line 2 */}
            <div style={{
              position: 'absolute',
              left: '28.72%',
              right: '35.2%',
              top: '51.56%',
              bottom: '48.44%',
              border: '2.91875px solid #000000',
            }} />
            {/* Line 3 */}
            <div style={{
              position: 'absolute',
              left: '28.72%',
              right: '45.14%',
              top: '67.78%',
              bottom: '32.22%',
              border: '2.91875px solid #000000',
            }} />
        <div className="relative" id="player-header-menu">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title="Menu"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Remove the image since we're using CSS lines */}
          </button>

          {menuOpen && (
            <div className="layout-menu-dropdown" style={{ width: '177px', height: '239px' }}>
              {/* Profile Settings */}
              <Link
                to="/profile?edit=true"
                onClick={() => setMenuOpen(false)}
                className="layout-menu-item"
                style={{ width: '157px', height: '36px', padding: '0px 8px' }}
              >
                Profile Settings
              </Link>

                  {/* Calculators */}
              <Link
                to="/calculators"
                onClick={() => setMenuOpen(false)}
                className="layout-menu-item"
                style={{ width: '157px', height: '36px', padding: '0px 8px' }}
              >
                Calculators
              </Link>

              {/* Search Users */}
              <Link
                to="/search"
                onClick={() => setMenuOpen(false)}
                className="layout-menu-item"
                style={{ width: '157px', height: '36px', padding: '0px 8px' }}
              >
                Search Users
              </Link>

              {/* Help & Support */}
              <Link
                to="/contact"
                onClick={() => setMenuOpen(false)}
                className="layout-menu-item"
                style={{ width: '157px', height: '36px', padding: '0px 8px' }}
              >
                Help & Support
              </Link>

              {/* Logout */}
              <button
                onClick={handleSignOut}
                className="layout-menu-item"
                style={{ width: '157px', height: '36px', padding: '0px 8px' }}
              >
                Logout
              </button>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
