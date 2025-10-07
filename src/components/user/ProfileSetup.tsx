import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { profileService, type ProfileData } from '../../services/profileService'
import { adminService } from '../../services/adminService'
import { useValuePropModal } from '../../hooks/useValuePropModal'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { useMobile } from '../../hooks/useMobile'
import { ValuePropModal } from '../upgrade/ValuePropModal'
import { SocialConnectModal } from '../social/SocialConnectModal'
import { ErrorModal } from '../common/ErrorModal'
import { SuccessModal } from '../common/SuccessModal'
import { extractStatsFromImage } from '../../utils/ocrService'
import logoSvg from "/images/logo.svg"
import { Upload } from 'lucide-react'
import './ProfileSetup.css'

const TEAM_COLORS = [
  { value: 'blue', label: 'Blue', color: '#0074D9' },
  { value: 'red', label: 'Red', color: '#FF4136' },
  { value: 'yellow', label: 'Yellow', color: '#FFDC00' },
  { value: 'black', label: 'Black', color: '#111111' },
  { value: 'green', label: 'Green', color: '#2ECC40' },
  { value: 'orange', label: 'Orange', color: '#FF851B' },
  { value: 'purple', label: 'Purple', color: '#B10DC9' },
  { value: 'pink', label: 'Pink', color: '#F012BE' }
]

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 
  'Japan', 'South Korea', 'Brazil', 'Mexico', 'Italy', 'Spain', 'Netherlands',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland','Pakistan' , 'Other'
]

export const ProfileSetup = () => {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMobile()
  const { isOpen, closeValueProp, daysRemaining } = useValuePropModal()
  const trialStatus = useTrialStatus()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [maxPokedexEntries, setMaxPokedexEntries] = useState(1000)
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<{id: string, name: string, url: string} | null>(null)
  const [showPrivacyUpgradeModal, setShowPrivacyUpgradeModal] = useState(false)
  
  const [profileData, setProfileData] = useState<ProfileData>({
    trainer_name: '',
    trainer_code: '',
    trainer_code_private: true,  // Default to private for trial users
    trainer_level: 1,
    start_date: '', // No default date - user must select
    country: '',
    team_color: '',
    average_daily_xp: 0,
    distance_walked: undefined,
    pokemon_caught: undefined,
    pokestops_visited: undefined,
    total_xp: undefined,
    unique_pokedex_entries: undefined,
    profile_screenshot_url: '',
    instagram: '',
    tiktok: '',
    twitter: '',
    youtube: '',
    twitch: '',
    reddit: '',
    facebook: '',
    snapchat: '',
    github: '',
    vimeo: '',
    discord: '',
    telegram: '',
    whatsapp: '',
    social_links_private: true  // Default to private for trial users
  })

  const [profileScreenshot, setProfileScreenshot] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrMessage, setOcrMessage] = useState<string | null>(null)
  const [hasExtractedStats, setHasExtractedStats] = useState(false)
  const [showTrainerCodeError, setShowTrainerCodeError] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Check if user already has a profile when component mounts
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const { hasProfile, error } = await profileService.hasProfile()
        
        if (error) {
          console.warn('Error checking existing profile:', error)
        }
        
        // If user already has a profile, redirect to dashboard
        if (hasProfile) {
          navigate('/', { replace: true })
          return
        }
      } catch (err) {
        console.warn('Error checking profile existence:', err)
      } finally {
        setCheckingProfile(false)
      }
    }

    checkExistingProfile()
  }, [navigate])

  // Fetch max Pokédex entries on mount
  useEffect(() => {
    const fetchMaxEntries = async () => {
      const { value, error } = await adminService.getMaxPokedexEntries();
      if (!error) {
        setMaxPokedexEntries(value);
      }
    };
    fetchMaxEntries();
  }, []);

  // Set email from user
  // Email is stored in auth.users table, not in profiles table
  // So we don't need to add it to profileData

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    // Special handling for trainer_code to enforce 12-digit limit
    if (field === 'trainer_code') {
      // Remove any non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      
      // Limit to 12 digits maximum
      const limitedValue = digitsOnly.slice(0, 12);
      
      setProfileData(prev => ({ ...prev, [field]: limitedValue }))
    } 
    // Special handling for trainer_level to enforce 1-50 range
    else if (field === 'trainer_level') {
      const numValue = parseInt(value) || 1;
      // Cap between 1 and 50
      const cappedValue = Math.max(1, Math.min(50, numValue));
      setProfileData(prev => ({ ...prev, [field]: cappedValue }))
    } 
    else {
      setProfileData(prev => ({ ...prev, [field]: value }))
    }
  }

  // Handle trainer code privacy toggle with trial restriction
  const handleTrainerCodePrivacyToggle = (checked: boolean) => {
    // If user is trial and trying to set to public (false), show upgrade modal
    if (!trialStatus.isPaidUser && !checked) {
      setShowPrivacyUpgradeModal(true)
      return
    }
    
    // Otherwise, allow the toggle
    handleInputChange('trainer_code_private', checked)
  }

  // Handle social links privacy toggle with trial restriction
  const handleSocialLinksPrivacyToggle = (checked: boolean) => {
    // If user is trial and trying to set to public (false), show upgrade modal
    if (!trialStatus.isPaidUser && !checked) {
      setShowPrivacyUpgradeModal(true)
      return
    }
    
    // Otherwise, allow the toggle
    handleInputChange('social_links_private', checked)
  }

  // Social Platform Management (from UserProfile)
  const handleSocialConnect = async (platform: string, url: string) => {
    setSaving(true)
    setError(null)

    try {
      // Update profile data with the new social platform URL
      const updatedData = {
        ...profileData,
        [platform]: url
      }

      setProfileData(updatedData)
      setSuccess(`${platform} connected successfully!`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to connect social platform')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenSocialModal = () => {
    setEditingPlatform(null)
    setIsSocialModalOpen(true)
  }

  const handleCloseSocialModal = () => {
    setIsSocialModalOpen(false)
    setEditingPlatform(null)
  }

  const handleEditPlatform = (platform: {id: string, name: string}) => {
    const currentUrl = profileData[platform.id as keyof ProfileData] as string
    setEditingPlatform({
      id: platform.id,
      name: platform.name,
      url: currentUrl || ''
    })
    setIsSocialModalOpen(true)
  }

  // Get connected social platforms with their icons (from UserProfile)
  const getConnectedPlatforms = () => {
    const platforms = [
      { 
        id: 'instagram', 
        name: 'Instagram',
        icon: (
          <svg width="20" height="20" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="22.3333" cy="22.25" r="22" fill="black"/>
            <path d="M17.5033 10.75H27.1633C30.8433 10.75 33.8333 13.74 33.8333 17.42V27.08C33.8333 28.849 33.1305 30.5455 31.8797 31.7964C30.6288 33.0473 28.9322 33.75 27.1633 33.75H17.5033C13.8233 33.75 10.8333 30.76 10.8333 27.08V17.42C10.8333 15.651 11.536 13.9545 12.7868 12.7036C14.0377 11.4527 15.7343 10.75 17.5033 10.75ZM17.2733 13.05C16.1753 13.05 15.1222 13.4862 14.3458 14.2626C13.5694 15.039 13.1333 16.092 13.1333 17.19V27.31C13.1333 29.5985 14.9848 31.45 17.2733 31.45H27.3933C28.4912 31.45 29.5443 31.0138 30.3207 30.2374C31.0971 29.461 31.5333 28.408 31.5333 27.31V17.19C31.5333 14.9015 29.6818 13.05 27.3933 13.05H17.2733ZM28.3708 14.775C28.752 14.775 29.1176 14.9265 29.3872 15.196C29.6568 15.4656 29.8083 15.8313 29.8083 16.2125C29.8083 16.5937 29.6568 16.9594 29.3872 17.229C29.1176 17.4985 28.752 17.65 28.3708 17.65C27.9895 17.65 27.6239 17.4985 27.3543 17.229C27.0847 16.9594 26.9333 16.5937 26.9333 16.2125C26.9333 15.8313 27.0847 15.4656 27.3543 15.196C27.6239 14.9265 27.9895 14.775 28.3708 14.775ZM22.3333 16.5C23.8582 16.5 25.3208 17.1058 26.3991 18.1841C27.4774 19.2625 28.0833 20.725 28.0833 22.25C28.0833 23.775 27.4774 25.2375 26.3991 26.3159C25.3208 27.3942 23.8582 28 22.3333 28C20.8083 28 19.3457 27.3942 18.2674 26.3159C17.1891 25.2375 16.5833 23.775 16.5833 22.25C16.5833 20.725 17.1891 19.2625 18.2674 18.1841C19.3457 17.1058 20.8083 16.5 22.3333 16.5ZM22.3333 18.8C21.4183 18.8 20.5407 19.1635 19.8937 19.8105C19.2467 20.4575 18.8833 21.335 18.8833 22.25C18.8833 23.165 19.2467 24.0425 19.8937 24.6895C20.5407 25.3365 21.4183 25.7 22.3333 25.7C23.2482 25.7 24.1258 25.3365 24.7728 24.6895C25.4198 24.0425 25.7833 23.165 25.7833 22.25C25.7833 21.335 25.4198 20.4575 24.7728 19.8105C24.1258 19.1635 23.2482 18.8 22.3333 18.8Z" fill="white"/>
          </svg>
        )
      },
      { 
        id: 'github', 
        name: 'GitHub',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        )
      },
      // Add all other platforms from UserProfile...
      { id: 'facebook', name: 'Facebook', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
      { id: 'vimeo', name: 'Vimeo', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z" /></svg> },
      { id: 'discord', name: 'Discord', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" /></svg> },
      { id: 'snapchat', name: 'Snapchat', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-1-.3-1.5-1.1-1.5-.8 0-1.1.5-.8 1.5.058.097.117.194.182.287.949 1.376 2.411 2.2 3.938 2.2.965 0 1.547.405 1.548 1.053 0 .658-.823 1.046-1.645 1.046-.347 0-.697-.063-1.05-.17-.529.05-.991.364-.902.85.08.439.567.72 1.07.72 1.02 0 1.906-.602 2.047-1.613.032-.242.048-.491.048-.747 0-1.272-.692-2.344-1.882-2.935-.966-.48-2.031-.769-3.093-.769-.629 0-1.252.097-1.845.279-.477.147-.954.357-1.391.657l-.014.011c-.366.285-.705.627-1.03 1.027-.517.641-.97 1.354-1.348 2.125-.427.87-.757 1.788-.986 2.737a24.077 24.077 0 0 0-.272 2.568c-.018.535.04 1.061.167 1.576.188.758.606 1.381 1.188 1.787.67.468 1.476.663 2.284.663.798 0 1.607-.184 2.335-.538.764-.371 1.403-.909 1.858-1.577.346-.509.577-1.086.674-1.697.076-.478.105-.965.087-1.454-.03-.852-.128-1.707-.312-2.549.146-.053.3-.088.459-.088.254 0 .532.06.824.172l.014.007c.412.16.864.274 1.319.274.892 0 1.696-.407 2.22-1.114.419-.563.673-1.287.673-2.063 0-1.388-.93-2.547-2.25-2.938-.84-.249-1.72-.376-2.607-.376-1.464 0-2.918.439-4.125 1.244-.493.33-.962.73-1.384 1.185-.296.319-.565.668-.809 1.036v-.06c.105-1.628.23-3.654-.299-4.847-1.583-3.545-4.94-3.821-5.93-3.821z"/></svg> },
      { id: 'telegram', name: 'Telegram', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg> },
      { id: 'youtube', name: 'YouTube', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
      { id: 'tiktok', name: 'TikTok', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> },
      { id: 'twitch', name: 'Twitch', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" /></svg> },
      { id: 'whatsapp', name: 'WhatsApp', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
      { id: 'reddit', name: 'Reddit', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg> },
    ]

    return platforms.filter(platform => profileData[platform.id as keyof ProfileData])
  }

  // Handle disconnecting a social platform
  const handleDisconnectPlatform = async (platform: string) => {
    setSaving(true)
    setError(null)

    try {
      const updatedData = {
        ...profileData,
        [platform]: ''
      }

      setProfileData(updatedData)
      setSuccess(`${platform} disconnected successfully!`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect social platform')
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setProfileScreenshot(file)
    setOcrMessage(null)
    setHasExtractedStats(false)
    
    if (file) {
      // Create image preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      console.log('📁 Image selected:', file.name, 'Size:', file.size, 'bytes')
      console.log('✅ Preview ready. Click "Extract Stats from Image" button to process.')
    } else {
      setImagePreview(null)
    }
  }

  const handleExtractStats = async () => {
    if (!profileScreenshot) {
      setOcrMessage('❌ Please select an image first')
      return
    }
    
    console.log('🔘 User clicked "Extract Stats" button')
    await processOCR(profileScreenshot)
  }

  const processOCR = async (file: File) => {
    console.log('🚀 Starting OCR processing for file:', file.name, 'Size:', file.size, 'bytes')
    
    setIsProcessingOCR(true)
    setOcrProgress(0)
    setOcrMessage('🔍 Analyzing screenshot...')

    try {
      console.log('📸 Calling extractStatsFromImage...')
      
      const result = await extractStatsFromImage(file, (progress) => {
        console.log(`📊 OCR Progress: ${Math.round(progress)}%`)
        setOcrProgress(Math.round(progress))
        setOcrMessage(`🔍 Processing image... ${Math.round(progress)}%`)
      })

      console.log('✅ OCR Extraction Complete!')
      console.log('📋 Raw OCR Text:', result.rawText)
      console.log('📊 Extracted Stats:', result.stats)
      console.log('🎯 Confidence Score:', result.confidence + '%')

      // Check if any stats were extracted
      const statsCount = Object.keys(result.stats).length
      if (statsCount === 0) {
        console.warn('⚠️ No stats were extracted from the image')
        setOcrMessage('⚠️ Could not extract stats from image. Please ensure the screenshot shows your Pokémon GO profile with visible stats.')
        setIsProcessingOCR(false)
        return
      }

      console.log(`✅ Successfully extracted ${statsCount} stat(s)`)

      // No validation needed for profile setup (no current stats to compare against)
      setOcrMessage('✅ Stats extracted successfully!')

      // Auto-fill the form with extracted stats
      const updatedData = { ...profileData }
      
      if (result.stats.total_xp !== undefined) {
        console.log(`✓ Total XP: ${result.stats.total_xp.toLocaleString()}`)
        updatedData.total_xp = result.stats.total_xp
      }
      
      if (result.stats.pokemon_caught !== undefined) {
        console.log(`✓ Pokémon Caught: ${result.stats.pokemon_caught.toLocaleString()}`)
        updatedData.pokemon_caught = result.stats.pokemon_caught
      }
      
      if (result.stats.distance_walked !== undefined) {
        console.log(`✓ Distance Walked: ${result.stats.distance_walked} km`)
        updatedData.distance_walked = result.stats.distance_walked
      }
      
      if (result.stats.pokestops_visited !== undefined) {
        console.log(`✓ PokéStops Visited: ${result.stats.pokestops_visited.toLocaleString()}`)
        updatedData.pokestops_visited = result.stats.pokestops_visited
      }
      
      if (result.stats.unique_pokedex_entries !== undefined) {
        console.log(`✓ Pokédex Entries: ${result.stats.unique_pokedex_entries}`)
        updatedData.unique_pokedex_entries = result.stats.unique_pokedex_entries
      }

      if (result.stats.trainer_level !== undefined) {
        console.log(`✓ Trainer Level: ${result.stats.trainer_level}`)
        updatedData.trainer_level = result.stats.trainer_level
      }

      if (result.stats.username !== undefined) {
        console.log(`✓ Username: ${result.stats.username}`)
        updatedData.trainer_name = result.stats.username
      }

      if (result.stats.start_date !== undefined) {
        console.log(`✓ Start Date: ${result.stats.start_date}`)
        // Convert from MM/DD/YYYY to YYYY-MM-DD
        const dateParts = result.stats.start_date.split('/')
        if (dateParts.length === 3) {
          updatedData.start_date = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`
        }
      }

      console.log('📝 Auto-filling form with extracted stats:', updatedData)
      setProfileData(updatedData)
      setHasExtractedStats(true)

      // Show success message (confidence logged to console only)
      setTimeout(() => {
        console.log(`✅ Extracted ${statsCount} stat(s) with ${Math.round(result.confidence)}% confidence`)
        setOcrMessage('✅ Stats extracted and auto-filled successfully!')
      }, 1000)

    } catch (err: any) {
      console.error('❌ OCR Error:', err)
      console.error('Error details:', err.message || err)
      setOcrMessage(`❌ Failed to extract stats: ${err.message || 'Unknown error'}. Please enter values manually.`)
    } finally {
      setIsProcessingOCR(false)
      setOcrProgress(100)
      console.log('🏁 OCR processing finished')
    }
  }

  const handleStatChange = (key: keyof ProfileData, value: string) => {
    // Handle empty value
    if (!value.trim()) {
      setProfileData(prev => ({ ...prev, [key]: undefined }));
      return;
    }

    // Remove leading zeros
    const cleanValue = value.replace(/^0+/, '');
    
    // Convert to appropriate type
    let parsedValue: number | undefined;
    if (key === 'distance_walked') {
      // Allow decimal for distance
      parsedValue = cleanValue ? parseFloat(cleanValue) : undefined;
    } else {
      // Integer for other stats
      parsedValue = cleanValue ? parseInt(cleanValue) : undefined;
    }

    // Validate value
    if (parsedValue !== undefined) {
      if (key === 'unique_pokedex_entries' && parsedValue > maxPokedexEntries) {
        return; // Don't update if exceeds max
      }
      if (parsedValue < 0) {
        return; // Don't update if negative
      }
    }

    setProfileData(prev => ({ ...prev, [key]: parsedValue }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(profileData.trainer_name && profileData.trainer_code && 
                 profileData.trainer_level && profileData.country && 
                 profileData.team_color && profileData.start_date)
      case 2:
        return true // All stats are optional
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2) {
        handleSubmit()
      } else {
        setCurrentStep(prev => prev + 1)
        setError(null)
      }
    } else {
      setError('Please fill in all required fields')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleSubmit = async () => {
    // Validate trainer code is exactly 12 digits
    if (profileData.trainer_code && profileData.trainer_code.length !== 12) {
      setShowTrainerCodeError(true)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      let screenshotUrl = ''
      
      // Upload screenshot if provided
      if (profileScreenshot) {
        const { data: uploadData, error: uploadError } = await profileService.uploadProfileScreenshot(profileScreenshot)
        
        if (uploadError) {
          throw new Error(uploadError.message || 'Failed to upload screenshot')
        }
        
        screenshotUrl = uploadData || ''
      }
      
      // Update existing profile (created during signup)
      const profileToSubmit = {
        ...profileData,
        profile_screenshot_url: screenshotUrl,
        is_profile_setup: true
      }
      
      const { error: updateError } = await profileService.updateProfile(profileToSubmit)
      
      if (updateError) {
        throw new Error(updateError.message || 'Failed to update profile')
      }
      
      // Update auth context
      await updateProfile({})
      
      // Show success modal instead of navigating directly
      setShowSuccessModal(true)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const renderProfileStep = () => (
    <>
      <h1 className="profile-setup-title">Set up your profile!</h1>
      
    <div className="profile-setup-form">
        {/* Email Address */}
      <div className="form-field">
        <label className="form-label">Email Address</label>
        <input
          type="email"
          value={user?.email || 'name.surname@example.com'}
          className="form-input"
          disabled
        />
      </div>

        {/* Trainer Name */}
      <div className="form-field">
        <label className="form-label">Trainer Name</label>
        <input
          type="text"
          value={profileData.trainer_name}
          onChange={(e) => handleInputChange('trainer_name', e.target.value)}
          className="form-input"
          placeholder="plyrzero"
          required
        />
      </div>

        {/* Trainer Level */}
      <div className="form-field">
        <label className="form-label">Trainer Level</label>
        <input
          type="number"
          min="1"
          max="50"
          value={profileData.trainer_level}
          onChange={(e) => handleInputChange('trainer_level', parseInt(e.target.value))}
          className="form-input"
          placeholder="50"
        />
      </div>

        {/* Trainer Code with Toggle */}
      {/* Frame 659 - Trainer Code Field */}
      <div className="form-field trainer-code-field">
        <label className="form-label">Trainer Code</label>
        <input
          type="text"
          value={profileData.trainer_code}
          onChange={(e) => handleInputChange('trainer_code', e.target.value)}
          className={`form-input ${profileData.trainer_code && profileData.trainer_code.length < 12 ? 'trainer-code-incomplete' : ''}`}
          placeholder="512348894"
          maxLength={12}
        />
        <div className="toggle-field">
          <span>Keep trainer code private</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={profileData.trainer_code_private}
              onChange={(e) => handleTrainerCodePrivacyToggle(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

        {/* Country */}
      <div className="form-field">
        <label className="form-label">Country</label>
        <select
          value={profileData.country}
          onChange={(e) => handleInputChange('country', e.target.value)}
          className="form-select"
        >
          <option value="">Choose your country</option>
          {COUNTRIES.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

        {/* Team Affiliation */}
      <div className="form-field">
        <label className="form-label">Team Affiliation</label>
        <select
          value={profileData.team_color}
          onChange={(e) => handleInputChange('team_color', e.target.value)}
          className="form-select"
        >
          <option value="">Choose your team</option>
          {TEAM_COLORS.map(team => (
            <option key={team.value} value={team.value}>{team.label}</option>
          ))}
        </select>
      </div>

        {/* Start Date */}
      <div className="form-field">
        <label className="form-label">Start Date</label>
        <input
          type="date"
          value={profileData.start_date}
          onChange={(e) => handleInputChange('start_date', e.target.value)}
          className="form-input"
          max={new Date().toISOString().split('T')[0]} // Can't select future dates
          required
        />
        <span className="form-hint">When did you start playing Pokémon GO?</span>
      </div>

      {/* Frame 371 - Social Platforms Section */}
      <div className="social-section">
        {/* Frame 370 - Social Header */}
        <div className="social-header">
          {/* Frame 368/367 - Icon + Text */}
          <div className="social-label-container">
            <div className="social-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.8 10.1333L12.2 7.86667M7.8 11.8667L12.2 14.1333M4 11C4 11.5304 4.21071 12.0391 4.58579 12.4142C4.96086 12.7893 5.46957 13 6 13C6.53043 13 7.03914 12.7893 7.41421 12.4142C7.78929 12.0391 8 11.5304 8 11C8 10.4696 7.78929 9.96086 7.41421 9.58579C7.03914 9.21071 6.53043 9 6 9C5.46957 9 4.96086 9.21071 4.58579 9.58579C4.21071 9.96086 4 10.4696 4 11ZM12 7C12 7.53043 12.2107 8.03914 12.5858 8.41421C12.9609 8.78929 13.4696 9 14 9C14.5304 9 15.0391 8.78929 15.4142 8.41421C15.7893 8.03914 16 7.53043 16 7C16 6.46957 15.7893 5.96086 15.4142 5.58579C15.0391 5.21071 14.5304 5 14 5C13.4696 5 12.9609 5.21071 12.5858 5.58579C12.2107 5.96086 12 6.46957 12 7ZM12 15C12 15.5304 12.2107 16.0391 12.5858 16.4142C12.9609 16.7893 13.4696 17 14 17C14.5304 17 15.0391 16.7893 15.4142 16.4142C15.7893 16.0391 16 15.5304 16 15C16 14.4696 15.7893 13.9609 15.4142 13.5858C15.0391 13.2107 14.5304 13 14 13C13.4696 13 12.9609 13.2107 12.5858 13.5858C12.2107 13.9609 12 14.4696 12 15Z" stroke="black" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="social-label-text">Social Platforms</span>
          </div>
        </div>

        {/* Connected Social Platforms */}
        {getConnectedPlatforms().map((platform) => (
          <div
            key={platform.id}
            className="connected-social-platform"
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "9px",
              }}
            >
              <div
                style={{
                  width: "20.77px",
                  height: "20.77px",
                  background: "#000000",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {platform.icon}
              </div>
              <span
                style={{
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 500,
                  fontSize: isMobile ? "14px" : "12px",
                  lineHeight: isMobile ? "20px" : "18px",
                  color: "#000000",
                }}
              >
                {platform.name}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => handleDisconnectPlatform(platform.id)}
                disabled={saving}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "4px 8px",
                  width: "62px",
                  height: "18px",
                  background: "#FEF2F2",
                  border: "1px solid #EF4444",
                  borderRadius: "6px",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "8px",
                  lineHeight: "12px",
                  color: "#EF4444",
                  cursor: "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                Disconnect
              </button>
              <button
                type="button"
                onClick={() => handleEditPlatform(platform)}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "4px 8px",
                  width: "62px",
                  height: "18px",
                  background: "#FFFFFF",
                  border: "1px solid #000000",
                  borderRadius: "6px",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                <svg style={{ width: "14px", height: "14px" }} viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 10L10 2M10 2H4M10 2V8"
                    stroke="black"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 500,
                    fontSize: isMobile ? "14px" : "12px",
                    lineHeight: isMobile ? "20px" : "18px",
                    color: "#000000",
                  }}
                >
                  Edit
                </span>
              </button>
            </div>
          </div>
        ))}

        {/* Frame 387 - Connect Button */}
        <button 
          className="social-connect-btn" 
          type="button"
          onClick={handleOpenSocialModal}
        >
          + Connect New Social Platform
        </button>
        
        {/* Frame 508 - Toggle */}
        <div className="toggle-field">
          <span>Keep social links private</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={profileData.social_links_private}
              onChange={(e) => handleSocialLinksPrivacyToggle(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
    </>
  )

  const renderStatsStep = () => (
    <>
      <h1 className="profile-setup-title">Set up your stats</h1>
      
    <div className="profile-setup-form">
        {/* Distance Walked */}
      <div className="form-field">
          <label className="form-label">Distance Walked (km)</label>
        <div className="input-with-unit">
          <input
            type="number"
              step="0.1"
            value={profileData.distance_walked || ''}
            onChange={(e) => handleStatChange('distance_walked', e.target.value)}
            className="form-input"
            placeholder="0"
            min="0"
          />
          <span className="input-unit">km</span>
        </div>
      </div>

        {/* Pokémon Caught */}
      <div className="form-field">
        <label className="form-label">Pokémon Caught</label>
        <input
          type="number"
          value={profileData.pokemon_caught || ''}
          onChange={(e) => handleStatChange('pokemon_caught', e.target.value)}
          className="form-input"
          placeholder="0"
          min="0"
        />
      </div>

        {/* PokéStops Visited */}
      <div className="form-field">
          <label className="form-label">PokéStops Visited</label>
        <input
          type="number"
          value={profileData.pokestops_visited || ''}
          onChange={(e) => handleStatChange('pokestops_visited', e.target.value)}
          className="form-input"
          placeholder="0"
          min="0"
        />
      </div>

        {/* Total XP */}
      <div className="form-field">
        <label className="form-label">Total XP</label>
        <input
          type="number"
          value={profileData.total_xp || ''}
          onChange={(e) => handleStatChange('total_xp', e.target.value)}
          className="form-input"
          placeholder="0"
          min="0"
        />
      </div>

      {/* Secondary Stats Heading */}
      <h2 className="secondary-stats-heading" style={{ textAlign: 'left', margin: '0' }}>Secondary stats</h2>

        {/* Unique Pokédex Entries */}
        <div className="form-field">
          <label className="form-label">Unique Pokédex Entries</label>
          <input
            type="number"
            value={profileData.unique_pokedex_entries || ''}
            onChange={(e) => handleStatChange('unique_pokedex_entries', e.target.value)}
            className="form-input"
            placeholder="0"
            min="0"
            max={maxPokedexEntries}
          />
      </div>

        {/* Screenshot Upload */}
      <div className="upload-section">
        <label className="form-label">Upload a screenshot of your Trainer Profile to verify your stats and auto-fill using OCR.</label>
        <div className="upload-area">
          <input
            type="file"
            id="screenshot-upload"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={isProcessingOCR}
          />
          <label htmlFor="screenshot-upload" className="upload-label" style={{ opacity: isProcessingOCR ? 0.6 : 1, cursor: isProcessingOCR ? 'not-allowed' : 'pointer' }}>
              <Upload size={16} />
            <span>Choose file</span>
              <span className="file-hint">{profileScreenshot ? profileScreenshot.name : 'No file chosen'}</span>
          </label>
        </div>
        {profileScreenshot && !isProcessingOCR && !hasExtractedStats && (
          <div className="file-selected">
              ✓ {profileScreenshot.name}
          </div>
        )}

        {/* Image Preview with Extract Button */}
        {imagePreview && !isProcessingOCR && !hasExtractedStats && (
          <div className="image-preview-with-ocr">
            <div className="preview-header">📸 Selected Screenshot:</div>
            <img src={imagePreview} alt="Screenshot preview" className="screenshot-preview-image" />
            <button 
              type="button"
              onClick={handleExtractStats}
              className="extract-button"
            >
              <span className="extract-icon">🔍</span>
              <span className="extract-text">Extract Stats from Image</span>
              <span className="extract-subtitle">Click to analyze screenshot using OCR</span>
            </button>
          </div>
        )}

        {/* OCR Processing Indicator */}
        {isProcessingOCR && (
          <div className="ocr-processing-container">
            <div className="ocr-spinner-ring"></div>
            <div className="ocr-progress-bar-container">
              <div className="ocr-progress-bar-fill" style={{ width: `${ocrProgress}%` }}></div>
            </div>
            <p className="ocr-status-text">{ocrMessage} ({ocrProgress}%)</p>
          </div>
        )}

        {/* OCR Result Message */}
        {!isProcessingOCR && ocrMessage && (
          <div className={`ocr-result-message ${ocrMessage.includes('✅') ? 'success' : ocrMessage.includes('❌') ? 'error' : 'warning'}`}>
            {ocrMessage}
          </div>
        )}

        {/* Extracted Stats Display */}
        {hasExtractedStats && (
          <div className="extracted-stats-card">
            <h3 className="extracted-stats-title">📊 Extracted Stats from Screenshot:</h3>
            <div className="extracted-stats-grid-setup">
              {profileData.trainer_name && (
                <div className="extracted-stat-box">
                  <div className="stat-icon-box">👤</div>
                  <div className="stat-label-box">Username</div>
                  <div className="stat-value-box">{profileData.trainer_name}</div>
                </div>
              )}
              {profileData.trainer_level && (
                <div className="extracted-stat-box">
                  <div className="stat-icon-box">🎖️</div>
                  <div className="stat-label-box">Level</div>
                  <div className="stat-value-box">{profileData.trainer_level}</div>
                </div>
              )}
              {profileData.total_xp !== undefined && (
                <div className="extracted-stat-box">
                  <div className="stat-icon-box">⭐</div>
                  <div className="stat-label-box">Total XP</div>
                  <div className="stat-value-box">{profileData.total_xp.toLocaleString()}</div>
                </div>
              )}
              {profileData.pokemon_caught !== undefined && (
                <div className="extracted-stat-box">
                  <div className="stat-icon-box">🔴</div>
                  <div className="stat-label-box">Pokémon Caught</div>
                  <div className="stat-value-box">{profileData.pokemon_caught.toLocaleString()}</div>
                </div>
              )}
              {profileData.distance_walked !== undefined && (
                <div className="extracted-stat-box">
                  <div className="stat-icon-box">👣</div>
                  <div className="stat-label-box">Distance Walked</div>
                  <div className="stat-value-box">{profileData.distance_walked} km</div>
                </div>
              )}
              {profileData.pokestops_visited !== undefined && (
                <div className="extracted-stat-box">
                  <div className="stat-icon-box">🔵</div>
                  <div className="stat-label-box">PokéStops Visited</div>
                  <div className="stat-value-box">{profileData.pokestops_visited.toLocaleString()}</div>
                </div>
              )}
              {profileData.unique_pokedex_entries !== undefined && (
                <div className="extracted-stat-box">
                  <div className="stat-icon-box">📖</div>
                  <div className="stat-label-box">Pokédex Entries</div>
                  <div className="stat-value-box">{profileData.unique_pokedex_entries}</div>
                </div>
              )}
              {profileData.start_date && (
                <div className="extracted-stat-box">
                  <div className="stat-icon-box">📅</div>
                  <div className="stat-label-box">Start Date</div>
                  <div className="stat-value-box">{profileData.start_date}</div>
                </div>
              )}
            </div>
            <p className="auto-fill-notice-setup">
              ✅ These values have been automatically filled in the form fields above. Review and continue!
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  )

  // Show loading while checking if profile already exists
  if (checkingProfile) {
    return (
      <div className="profile-setup-wrapper">
            <div className="loading-container">
          <div className="loading-spinner">
            <svg className="spinner" viewBox="0 0 24 24">
              <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" />
              <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p>Checking profile status...</p>
        </div>
      </div>
    )
  }

  const renderContent = () => (
    <div className="profile-setup-content">
      {/* Error and Success Messages */}
      {error && (
        <div className="profile-error-message" style={{ marginBottom: isMobile ? "2px" : "1rem" }}>
          <span>{error}</span>
          </div>
      )}

      {success && (
        <div className="profile-success-message" style={{ marginBottom: isMobile ? "2px" : "1rem" }}>
          <span>{success}</span>
            </div>
          )}

      {/* Frame 528 - Contains Header + Form */}
      <div className="profile-setup-form-wrapper">
        {/* Frame 527 - Header with Logo */}
        <div className="profile-setup-header">
          <img src={logoSvg} alt="PlayerZERO" className="profile-setup-logo" />
        </div>

        {/* Frame 662 - Main Form Content */}
        <div className="profile-setup-main">
          {currentStep === 1 ? renderProfileStep() : renderStatsStep()}
        </div>
      </div>

      {/* Frame 666 - Action Buttons */}
      <div className="profile-setup-actions">
        <div className="action-buttons">
            <button
              type="button"
              onClick={prevStep}
            className="btn-back"
              disabled={currentStep === 1}
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
            className="btn-next"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">
                  <svg className="spinner" viewBox="0 0 24 24">
                    <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" />
                    <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
            ) : currentStep === 2 ? 'Save' : 'Next'}
            </button>
          </div>
        </div>
    </div>
  )

  return (
    <>
      {/* Modals */}
      <ValuePropModal 
        isOpen={isOpen} 
        onClose={closeValueProp} 
        daysRemaining={daysRemaining} 
      />

      <SocialConnectModal
        isOpen={isSocialModalOpen}
        onClose={handleCloseSocialModal}
        onConnect={handleSocialConnect}
        editingPlatform={editingPlatform}
      />

      <ErrorModal
        isOpen={showTrainerCodeError}
        onClose={() => setShowTrainerCodeError(false)}
        title="ERROR!"
        message="Trainer code must be exactly 12 digits"
        confirmText="Retry"
        cancelText="Cancel"
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          navigate('/paywall')
        }}
        title="SUCCESS!"
        message="Profile setup completed successfully"
        confirmText="Okay"
      />

      {/* Privacy Upgrade Modal */}
      <ErrorModal
        isOpen={showPrivacyUpgradeModal}
        onClose={() => setShowPrivacyUpgradeModal(false)}
        title="Premium Feature"
        message="Sharing your Trainer Code and Socials is a premium feature. Upgrade to unlock."
        confirmText="Upgrade Now"
        cancelText="Cancel"
        onConfirm={() => navigate('/upgrade')}
      />

      {/* Mobile View */}
      <div className="profile-setup-wrapper">
        {renderContent()}
      </div>

      {/* Desktop/Web View - Split Layout */}
      <div className="profile-setup-split-layout">
        <div className="profile-setup-left">
          {renderContent()}
      </div>

        <div className="profile-setup-right">
          <div className="profile-setup-hero">
          <h1>Grind.</h1>
          <h1>Compete.</h1>
          <h1>Flex.</h1>
        </div>
      </div>
    </div>
    </>
  )
}