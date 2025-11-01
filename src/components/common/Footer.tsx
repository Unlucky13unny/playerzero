import React from 'react'

interface FooterProps {
  fixed?: boolean
}

export const Footer: React.FC<FooterProps> = ({ fixed = false }) => {
  return (
    <div style={{
      position: fixed ? 'fixed' : 'relative',
      bottom: fixed ? 0 : 'auto',
      left: fixed ? 0 : 'auto',
      right: fixed ? 0 : 'auto',
      width: '100%',
      minHeight: '80px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #EBEFF2',
      padding: '20px',
      gap: '4px',
      marginTop: fixed ? '0' : '-120px',
      
      zIndex: fixed ? 100 : 'auto',
    }}>
      <span style={{
        fontFamily: 'Poppins',
        fontStyle: 'normal',
        fontWeight: 400,
        fontSize: '14px',
        lineHeight: '18px',
        color: '#666666',
        textAlign: 'center',
      }}>
        © 2025 PlayerZero. All rights reserved.
      </span>
      <span style={{
        fontFamily: 'Poppins',
        fontStyle: 'normal',
        fontWeight: 400,
        fontSize: '12px',
        lineHeight: '18px',
        color: '#999999',
        textAlign: 'center',
      }}>
        Powering the next generation of Pokemon GO trainers
      </span>
    </div>
  )
}

