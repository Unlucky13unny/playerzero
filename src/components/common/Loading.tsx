import React from 'react'

interface LoadingProps {
  message?: string
  fullScreen?: boolean
  backgroundColor?: string
  textColor?: string
  fontSize?: string
  className?: string
}

/**
 * Standardized Loading Component
 * - No spinning animations
 * - Professional centered text
 * - Red color by default
 * - Customizable message
 * - Works on both web and mobile
 */
export const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading your Profile...',
  fullScreen = false,
  backgroundColor = 'transparent',
  textColor = '#DC2627',
  fontSize = '18px',
  className = ''
}) => {
  const containerStyle: React.CSSProperties = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: backgroundColor,
    zIndex: 1000
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '200px',
    backgroundColor: backgroundColor
  }

  const textStyle: React.CSSProperties = {
    color: textColor,
    fontSize: fontSize,
    fontWeight: '600',
    fontFamily: 'Poppins, sans-serif',
    textAlign: 'center',
    margin: 0,
    padding: '0 20px',
    letterSpacing: '0.01em'
  }

  return (
    <div style={containerStyle} className={className}>
      <p style={textStyle}>{message}</p>
    </div>
  )
}

/**
 * Loading variant for modal/overlay contexts
 */
export const LoadingOverlay: React.FC<Omit<LoadingProps, 'fullScreen'>> = (props) => {
  return <Loading {...props} fullScreen={true} backgroundColor="rgba(255, 255, 255, 0.95)" />
}

/**
 * Loading variant for inline/section contexts
 */
export const LoadingInline: React.FC<Omit<LoadingProps, 'fullScreen'>> = (props) => {
  return <Loading {...props} fullScreen={false} />
}

/**
 * Loading variant for dark backgrounds
 */
export const LoadingDark: React.FC<LoadingProps> = (props) => {
  return <Loading {...props} textColor="#FFFFFF" backgroundColor="rgba(0, 0, 0, 0.85)" />
}

