import { type CSSProperties } from 'react'
import logoSvg from "/images/logo.svg"

type LogoProps = {
  size?: 'small' | 'medium' | 'large'
  className?: string
  style?: CSSProperties
}

export const Logo = ({ size = 'medium', className = '', style = {} }: LogoProps) => {
  const height = (() => {
    switch (size) {
      case 'small':
        return '24px'
      case 'large':
        return '50px'
      case 'medium':
      default:
        return '40px'
    }
  })()

  return (
    <div className={`logo ${className}`} style={{ 
      ...style, 
      display: 'inline-block',
    }}>
      <img 
        src={logoSvg} 
        alt="PlayerZERO Logo" 
        style={{ 
          height,
          width: 'auto',
          ...style
        }} 
      />
    </div>
  )
} 