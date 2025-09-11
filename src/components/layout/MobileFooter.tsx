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
    /* Frame 549 */
    <div style={{
      /* Auto layout */
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0px',
      gap: '8px',
      
      position: 'fixed',
      width: '393px',
      height: '88px',
      left: 'calc(50% - 393px/2)',
      bottom: '0px',
      
      background: '#FFFFFF',
      zIndex: 1000,
      
      /* Responsive fallback for smaller screens */
      minWidth: '353px',
      maxWidth: '100vw',
    }}>
      
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
        
        border: currentPage === "profile" ? '1px solid #DC2627' : '1px solid #000000',
        borderRadius: '12px',
        
        /* Inside auto layout */
        flex: 'none',
        order: 0,
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
          
          {/* Profile Icon SVG */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Vector - Body */}
            <path 
              d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" 
              stroke={currentPage === "profile" ? "#DC2627" : "#000000"}
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            {/* Vector - Head */}
            <circle 
              cx="12" 
              cy="7" 
              r="4" 
              stroke={currentPage === "profile" ? "#DC2627" : "#000000"}
              strokeWidth="2"
            />
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
          
          color: currentPage === "profile" ? "#DC2627" : "#000000",
          
          /* Inside auto layout */
          flex: 'none',
          order: 1,
          flexGrow: 0,
        }}>
            Profile
        </span>
        
        </Link>
      
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
        
        border: '1px solid #DC2627',
        borderRadius: '12px',
        
        /* Inside auto layout */
        flex: 'none',
        order: 1,
        flexGrow: 0,
        
        textDecoration: 'none',
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
          
          {/* Leaderboard Icon SVG */}
          <svg width="24" height="24" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
            position: 'absolute',
            left: '12.5%',
            right: '12.5%',
            top: '12.5%',
            bottom: '12.5%',
          }}>
            <path 
              d="M3.78575 5.42857H2.07146M3.78575 5.42857V3.02857C3.78575 2.9831 3.76769 2.9395 3.73554 2.90735C3.70339 2.8752 3.65979 2.85714 3.61432 2.85714H2.24289C2.19743 2.85714 2.15382 2.8752 2.12167 2.90735C2.08952 2.9395 2.07146 2.9831 2.07146 3.02857V5.42857M3.78575 5.42857H5.32861C5.37407 5.42857 5.41768 5.41051 5.44982 5.37836C5.48197 5.34621 5.50003 5.30261 5.50003 5.25714V4.6C5.50003 4.55453 5.48197 4.51093 5.44982 4.47878C5.41768 4.44663 5.37407 4.42857 5.32861 4.42857H3.95718C3.91171 4.42857 3.86811 4.44663 3.83596 4.47878C3.80381 4.51093 3.78575 4.55453 3.78575 4.6V5.42857ZM2.07146 5.42857V4.02857C2.07146 3.9831 2.0534 3.9395 2.02125 3.90735C1.9891 3.8752 1.9455 3.85714 1.90003 3.85714H0.528606C0.483141 3.85714 0.439537 3.8752 0.407388 3.90735C0.375239 3.9395 0.357178 3.9831 0.357178 4.02857V5.25714C0.357178 5.30261 0.375239 5.34621 0.407388 5.37836C0.439537 5.41051 0.483141 5.42857 0.528606 5.42857H2.07146ZM2.58746 0.889428L2.84718 0.338856C2.85419 0.323117 2.86561 0.309747 2.88006 0.300364C2.89451 0.290981 2.91138 0.285988 2.92861 0.285988C2.94584 0.285988 2.9627 0.290981 2.97715 0.300364C2.9916 0.309747 3.00302 0.323117 3.01003 0.338856L3.27003 0.889428L3.85061 0.978285C3.92518 0.989713 3.95489 1.08571 3.90089 1.14057L3.48089 1.56914L3.58003 2.17428C3.59261 2.252 3.51489 2.31143 3.44803 2.27457L2.92861 1.98886L2.40918 2.27457C2.34261 2.31114 2.26461 2.252 2.27718 2.17428L2.37632 1.56914L1.95632 1.14057C1.90203 1.08571 1.93203 0.989713 2.00632 0.978285L2.58746 0.889428Z" 
              stroke="#DC2627"
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
          
          color: "#DC2627",
          
          /* Inside auto layout */
          flex: 'none',
          order: 1,
          flexGrow: 0,
        }}>
            Leaderboard
        </span>
        
        </Link>
      
    </div>
  )
}
