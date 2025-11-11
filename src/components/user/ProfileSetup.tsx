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

import { StatUpdateModal } from '../common/StatUpdateModal'

import { extractStatsFromImage } from '../../utils/ocrService'

import logoSvg from "/images/logo.svg"

import { Upload, X } from 'lucide-react'

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

  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',

  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',

  'Bangladesh', 'Barbados', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',

  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso',

  'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic',

  'Chad', 'Chile', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba',

  'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',

  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia',

  'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia',

  'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',

  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iraq',

  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',

  'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',

  'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',

  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',

  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',

  'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand',

  'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',

  'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',

  'Poland', 'Portugal', 'Qatar', 'Romania', 'Rwanda', 'Saint Kitts and Nevis',

  'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',

  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',

  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',

  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan',

  'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',

  'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia',

  'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',

  'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',

  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe', 'Other'

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

  const [_ocrMessage, setOcrMessage] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const [_hasExtractedStats, setHasExtractedStats] = useState(false)

  const [showTrainerCodeError, setShowTrainerCodeError] = useState(false)

  const [showSuccessModal, setShowSuccessModal] = useState(false)

  

  // NEW: Upload mode selection modal state

  const [showUploadModal, setShowUploadModal] = useState(false)

  const [uploadMode, setUploadMode] = useState<'manual' | 'extract' | null>(null)

  const [manualModeConfirmed, setManualModeConfirmed] = useState(false)

  const [_extractModeConfirmed, setExtractModeConfirmed] = useState(false)

  

  // NEW: Review modal state for extracted stats

  const [showReviewModal, setShowReviewModal] = useState(false)

  const [extractedStatsData, setExtractedStatsData] = useState<Partial<ProfileData> | null>(null)

  

  // NEW: Reminder modal state

  const [showReminderModal, setShowReminderModal] = useState(false)

  // OCR Error modal state

  const [showOCRErrorModal, setShowOCRErrorModal] = useState(false)

  

  // Freeze overlay state - prevents interaction during OCR

  const [showFreezeOverlay, setShowFreezeOverlay] = useState(false)



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



  // Auto-trigger upload modal when stats section (step 2) opens

  useEffect(() => {

    if (currentStep === 2) {

      handleOpenUploadModal()

    }

  }, [currentStep])



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

    // Special handling for trainer_level to allow editing while enforcing 1-80 range

    else if (field === 'trainer_level') {

      // Allow empty string for deletion, or store the raw value for typing

      if (value === '' || value === null || value === undefined) {

        setProfileData(prev => ({ ...prev, [field]: '' as any }))

      } else {

        const numValue = parseInt(value);

        // Only validate if it's a valid number

        if (!isNaN(numValue)) {

          // Cap between 1 and 80

          const cappedValue = Math.max(1, Math.min(80, numValue));

          setProfileData(prev => ({ ...prev, [field]: cappedValue }))

        }

      }

    } 

    else {

      setProfileData(prev => ({ ...prev, [field]: value }))

    }

  }



  // Handle trainer code privacy toggle with trial restriction

  const handleTrainerCodePrivacyToggle = (checked: boolean) => {

    // If user is trial user, block the toggle and show upgrade modal
    if (!trialStatus.isPaidUser) {
      setShowPrivacyUpgradeModal(true)

      return

    }

    

    // Otherwise, allow the toggle (paid users only)
    handleInputChange('trainer_code_private', checked)

  }



  // Handle social links privacy toggle with trial restriction

  const handleSocialLinksPrivacyToggle = (checked: boolean) => {

    // If user is trial user, block the toggle and show upgrade modal
    if (!trialStatus.isPaidUser) {
      setShowPrivacyUpgradeModal(true)

      return

    }

    

    // Otherwise, allow the toggle (paid users only)
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



  // NEW: Handle opening the upload mode selection modal

  const handleOpenUploadModal = () => {

    setShowUploadModal(true)

    // If already in manual mode and have a file, don't reset

    if (!manualModeConfirmed) {

      setUploadMode(null)

    }

  }



  // NEW: Handle manual entry mode selection

  const handleSelectManualMode = () => {

    // Just toggle the mode - don't confirm yet

    setUploadMode('manual')

    setManualModeConfirmed(false)

    setExtractModeConfirmed(false)

    setOcrMessage(null)

    setHasExtractedStats(false)

  }



  // NEW: Handle direct extract mode selection

  const handleSelectExtractMode = () => {

    // Just toggle the mode - don't confirm yet

    setUploadMode('extract')

    setExtractModeConfirmed(false)

    setManualModeConfirmed(false)

    setOcrMessage(null)

    setHasExtractedStats(false)

  }

  

  // NEW: Confirm extract mode and trigger OCR

  const handleConfirmExtractMode = async () => {

    setExtractModeConfirmed(true)

    setShowUploadModal(false)

    setShowFreezeOverlay(true) // Freeze screen during processing

    if (profileScreenshot) {

      await processOCR(profileScreenshot)

    }

  }



  // NEW: Confirm manual mode and close modal

  const handleConfirmManualMode = () => {

    setManualModeConfirmed(true)

    setShowUploadModal(false)

    // Keep uploadMode as 'manual' and file attached

    // Scroll to form

    window.scrollTo({ top: 0, behavior: 'smooth' })

  }



  // NEW: Close upload modal

  const handleCloseUploadModal = () => {

    setShowUploadModal(false)

    // Reset if user cancels

    if (!manualModeConfirmed && uploadMode !== 'extract') {

      setUploadMode(null)

      setProfileScreenshot(null)

    }

  }



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0] || null

    setProfileScreenshot(file)

    setOcrMessage(null)

    setHasExtractedStats(false)

    

    if (file) {

      // Auto-select "Extract stats" when image is uploaded

      setUploadMode('extract')

      

      // Create image preview

      const reader = new FileReader()

      reader.onloadend = () => {

        setImagePreview(reader.result as string)

      }

      reader.readAsDataURL(file)

      

      console.log('📁 Image selected:', file.name, 'Size:', file.size, 'bytes')

      console.log('✅ Preview ready. Extract stats auto-selected.')

    } else {

      setImagePreview(null)

    }

  }



  const processOCR = async (file: File) => {

    console.log('🚀 Starting OCR processing for file:', file.name, 'Size:', file.size, 'bytes')

    

    setIsProcessingOCR(true)

    setShowFreezeOverlay(true) // Ensure freeze overlay is shown

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

        setIsProcessingOCR(false)

        setShowOCRErrorModal(true)

        return

      }



      console.log(`✅ Successfully extracted ${statsCount} stat(s)`)



      // No validation needed for profile setup (no current stats to compare against)

      setOcrMessage('✅ Stats extracted successfully!')



      // Prepare extracted stats data

      const extractedData: Partial<ProfileData> = {}

      

      if (result.stats.total_xp !== undefined) {

        console.log(`✓ Total XP: ${result.stats.total_xp.toLocaleString()}`)

        extractedData.total_xp = result.stats.total_xp

      }

      

      if (result.stats.pokemon_caught !== undefined) {

        console.log(`✓ Pokémon Caught: ${result.stats.pokemon_caught.toLocaleString()}`)

        extractedData.pokemon_caught = result.stats.pokemon_caught

      }

      

      if (result.stats.distance_walked !== undefined) {

        console.log(`✓ Distance Walked: ${result.stats.distance_walked} km`)

        extractedData.distance_walked = result.stats.distance_walked

      }

      

      if (result.stats.pokestops_visited !== undefined) {

        console.log(`✓ PokéStops Visited: ${result.stats.pokestops_visited.toLocaleString()}`)

        extractedData.pokestops_visited = result.stats.pokestops_visited

      }

      

      if (result.stats.unique_pokedex_entries !== undefined) {

        console.log(`✓ Pokédex Entries: ${result.stats.unique_pokedex_entries}`)

        extractedData.unique_pokedex_entries = result.stats.unique_pokedex_entries

      }



      if (result.stats.trainer_level !== undefined) {

        console.log(`✓ Trainer Level: ${result.stats.trainer_level}`)

        extractedData.trainer_level = result.stats.trainer_level

      }



      if (result.stats.username !== undefined) {

        console.log(`✓ Username: ${result.stats.username}`)

        extractedData.trainer_name = result.stats.username

      }



      if (result.stats.start_date !== undefined) {

        console.log(`✓ Start Date: ${result.stats.start_date}`)

        // Convert from MM/DD/YYYY to YYYY-MM-DD

        const dateParts = result.stats.start_date.split('/')

        if (dateParts.length === 3) {

          extractedData.start_date = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`

        }

      }



      console.log('📝 Extracted stats prepared for review:', extractedData)

      

      // Store extracted stats and show review modal

      setExtractedStatsData(extractedData)

      setIsProcessingOCR(false)

      setShowFreezeOverlay(false) // Unfreeze when modal opens

      setShowReviewModal(true)



      // Log confidence to console

        console.log(`✅ Extracted ${statsCount} stat(s) with ${Math.round(result.confidence)}% confidence`)



    } catch (err: any) {

      console.error('❌ OCR Error:', err)

      console.error('Error details:', err.message || err)

      setOcrMessage(`❌ Failed to extract stats: ${err.message || 'Unknown error'}. Please enter values manually.`)

      setShowFreezeOverlay(false) // Unfreeze on error

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

      // Ensure trainer_level has a valid value (default to 1 if empty)

      const levelValue = Number(profileData.trainer_level);

      const validatedProfileData = {

        ...profileData,

        trainer_level: (!profileData.trainer_level || isNaN(levelValue) || levelValue < 1) 

          ? 1 

          : Math.max(1, Math.min(80, levelValue))

      };

      

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

        ...validatedProfileData,

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

          max="80"

          value={(profileData.trainer_level as any) === '' ? '' : (profileData.trainer_level || '')}

          onChange={(e) => handleInputChange('trainer_level', e.target.value)}

          className="form-input"

          placeholder="Enter level (1-80)"

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

          min="2016-07-01" // Pokémon GO launch date

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



        {/* Screenshot Upload - SAME AS UPDATESTATS.TSX */}

      <div className="upload-section">

        <div

          style={{

            display: "flex",

            flexDirection: "column",

            alignItems: "flex-start",

            gap: "2px",

            width: "100%",

          }}

        >

          <label

            style={{

              fontFamily: "Poppins",

              fontStyle: "normal",

              fontWeight: 400,

              fontSize: isMobile ? "12px" : "11px",

              lineHeight: isMobile ? "18px" : "16px",

              color: "#000000",

              width: "100%",

              textAlign: "left",

            }}

          >

            Upload new screenshot

          </label>

            <button 

              type="button"

            onClick={handleOpenUploadModal}

            style={{

              display: "flex",

              flexDirection: "row",

              alignItems: "center",

              width: "100%",

              height: isMobile ? "44px" : "36px",

              background: "#FFFFFF",

              border: "1px dashed #848282",

              borderRadius: "6px",

              padding: isMobile ? "12px" : "9px",

              gap: "10px",

              boxSizing: "border-box",

              cursor: "pointer",

              transition: "all 0.2s ease",

            }}

            onMouseEnter={(e) => {

              e.currentTarget.style.borderColor = "#555"

              e.currentTarget.style.backgroundColor = "#f9f9f9"

            }}

            onMouseLeave={(e) => {

              e.currentTarget.style.borderColor = "#848282"

              e.currentTarget.style.backgroundColor = "#FFFFFF"

            }}

          >

            <Upload style={{ width: isMobile ? "20px" : "16px", height: isMobile ? "20px" : "16px", color: "#000000" }} />

            <span

              style={{

                fontFamily: "Poppins",

                fontStyle: "normal",

                fontWeight: 400,

                fontSize: isMobile ? "14px" : "12px",

                lineHeight: isMobile ? "20px" : "18px",

                color: "#000000",

              }}

            >

              Choose upload method

            </span>

            </button>

          <span

            style={{

              fontFamily: "Poppins",

              fontStyle: "normal",

              fontWeight: 400,

              fontSize: isMobile ? "12px" : "11px",

              lineHeight: isMobile ? "18px" : "16px",

              color: "#666666",

            }}

          >

            {profileScreenshot ? `✓ ${profileScreenshot.name}` : "Manual entry or OCR extraction"}

          </span>

          </div>



        {/* Hidden file input for direct extraction mode */}

        <input

          type="file"

          id="profile-screenshot-upload"

          onChange={handleFileChange}

          accept="image/*"

          style={{ display: "none" }}

        />

        

        {/* OCR Processing Indicator - NEW DESIGN */}

        {isProcessingOCR && (

          <div

            style={{

              boxSizing: "border-box",

              display: "flex",

              flexDirection: "column",

              alignItems: "flex-start",

              padding: "16px 8px",

              gap: "10px",

              width: isMobile ? "353px" : "100%",

              height: "60px",

              border: "0.5px solid #DC2627",

              borderRadius: "6px",

              flex: "none",

              order: 2,

              alignSelf: "stretch",

              flexGrow: 0,

              marginTop: "16px",

            }}

          >

            <div

              style={{

                display: "flex",

                flexDirection: "column",

                alignItems: "flex-start",

                padding: "0px",

                gap: "8px",

                width: isMobile ? "337px" : "calc(100% - 16px)",

                height: "28px",

                flex: "none",

                order: 0,

                alignSelf: "stretch",

                flexGrow: 0,

              }}

            >

              <div

                style={{

                  width: isMobile ? "173px" : "auto",

                  height: "16px",

                  fontFamily: "Poppins",

                  fontStyle: "normal",

                  fontWeight: 400,

                  fontSize: "12px",

                  lineHeight: "16px",

                  textAlign: "right",

                  color: "#90A1B9",

                  flex: "none",

                  order: 0,

                  flexGrow: 0,

                  alignSelf: "flex-end",

                }}

              >

                {ocrProgress}%

            </div>

              <div

                style={{

                  position: "relative",

                  width: isMobile ? "337px" : "100%",

                  height: "4px",

                  flex: "none",

                  order: 1,

                  alignSelf: "stretch",

                  flexGrow: 0,

                }}

              >

                <div

                  style={{

                    position: "absolute",

                    height: "4px",

                    left: "0%",

                    right: "0%",

                    top: "0px",

                    background: "#E2E8F0",

                    borderRadius: "999px",

                  }}

                />

                <div

                  style={{

                    position: "absolute",

                    height: "4px",

                    left: "0%",

                    right: `${100 - ocrProgress}%`,

                    top: "0px",

                    background: "#FB2C36",

                    borderRadius: "999px",

                    transition: "right 0.3s ease",

                  }}

                />

          </div>

          </div>

                </div>

              )}

      </div>

    </div>

    </>

  )



  // Show loading while checking if profile already exists

  if (checkingProfile) {

    return (

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%' }}>

        <p style={{ fontSize: '18px', color: '#DC2627', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textAlign: 'center', padding: '0 20px' }}>Loading your Profile...</p>

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

              {loading ? 'Saving...' : currentStep === 2 ? 'Save' : 'Next'}

            </button>

          </div>

        </div>

    </div>

  )



  return (

    <>

      {/* NEW: Upload Mode Selection Modal - EXACT COPY FROM UPDATESTATS.TSX */}

      {showUploadModal && (

        <div style={{

          position: 'fixed',

          top: 0,

          left: 0,

          right: 0,

          bottom: 0,

          backgroundColor: 'rgba(0, 0, 0, 0.6)',

          display: 'flex',

          alignItems: 'center',

          justifyContent: 'center',

          zIndex: 9999,

          padding: '20px',

        }}>

          {/* Modal Container - Figma: New Upload */}

          <div style={{

            // Exact Figma specs

            position: 'relative',

            width: isMobile ? '353px' : '400px',

            height: profileScreenshot 

              ? (uploadMode === 'manual' && manualModeConfirmed 

                  ? (isMobile ? '540px' : '600px')  // Confirmation view height

                  : (isMobile ? '613px' : '680px'))  // Image preview height

              : (isMobile ? '241px' : '280px'), // Original height

            

            // Background - Figma: bg (White)

            background: '#FFFFFF',

            borderRadius: '24px',

            

            // Filter/Shadow from Figma

            filter: 'drop-shadow(0px 0px 48px rgba(0, 0, 0, 0.04))',

            boxSizing: 'border-box',

            transition: 'height 0.3s ease', // Smooth transition

          }}>

            {/* Toggle Section - Figma: Toggle */}

            <div

              style={{

                // Auto layout

                display: 'flex',

                flexDirection: 'row',

                alignItems: 'center',

                justifyContent: 'center',

                padding: '4px',

                gap: '4px',

                

                // Positioning - Exact Figma specs

                position: 'absolute',

                width: isMobile ? '266px' : '300px',

                height: '36px',

                left: isMobile ? 'calc(50% - 266px/2 + 0.5px)' : 'calc(50% - 300px/2)',

                top: '16px',

                

                // Grey 01 background

                background: '#F7F9FB',

                boxShadow: 'inset 0px 0px 2px rgba(0, 0, 0, 0.1)',

                borderRadius: '40px',

              }}

            >

              {/* Extract Stats Button */}

              <button

                type="button"

                onClick={handleSelectExtractMode}

                disabled={!profileScreenshot}

                style={{

                  // Auto layout

                  display: 'flex',

                  flexDirection: 'row',

                  justifyContent: 'center',

                  alignItems: 'center',

                  padding: '7px 20px',

                  gap: '10px',

                  

                  // Exact Figma size

                  width: '114px',

                  height: '28px',

                  

                  // Style - Black when extract mode selected, grey otherwise

                  background: !profileScreenshot ? '#E5E7EB' : (uploadMode === 'extract' ? '#000000' : '#F7F9FB'),

                  borderRadius: '40px',

                  border: 'none',

                  

                  // Inside auto layout

                  flex: 'none',

                  order: 0,

                  flexGrow: 0,

                  

                  cursor: !profileScreenshot ? 'not-allowed' : 'pointer',

                  transition: 'all 0.2s ease',

                  opacity: !profileScreenshot ? 0.6 : 1,

                }}

                onMouseEnter={(e) => {

                  if (profileScreenshot && uploadMode !== 'extract') {

                    e.currentTarget.style.background = '#EBEFF2'

                  }

                }}

                onMouseLeave={(e) => {

                  if (profileScreenshot) {

                    e.currentTarget.style.background = uploadMode === 'extract' ? '#000000' : '#F7F9FB'

                  }

                }}

              >

                <span style={{

                  fontFamily: 'Poppins',

                  fontStyle: 'normal',

                  fontWeight: 600,

                  fontSize: '12px',

                  lineHeight: '14px',

                  textAlign: 'center',

                  color: !profileScreenshot ? '#9CA3AF' : (uploadMode === 'extract' ? '#FFFFFF' : '#000000'),

                  flex: 'none',

                  order: 0,

                  flexGrow: 0,

                }}>

                  Extract stats

                </span>

              </button>



              {/* Update Manually Button */}

              <button

                type="button"

                onClick={handleSelectManualMode}

                disabled={!profileScreenshot}

                style={{

                  // Auto layout

                  display: 'flex',

                  flexDirection: 'row',

                  justifyContent: 'center',

                  alignItems: 'center',

                  padding: '7px 20px',

                  gap: '10px',

                  

                  // Exact Figma size

                  width: '138px',

                  height: '28px',

                  

                  // Style - Black when manual mode selected, grey otherwise

                  background: uploadMode === 'manual' ? '#000000' : '#F7F9FB',

                  borderRadius: '40px',

                  border: 'none',

                  

                  // Inside auto layout

                  flex: 'none',

                  order: 1,

                  flexGrow: 0,

                  

                  cursor: !profileScreenshot ? 'not-allowed' : 'pointer',

                  transition: 'all 0.2s ease',

                  opacity: !profileScreenshot ? 0.6 : 1,

                }}

                onMouseEnter={(e) => {

                  if (profileScreenshot && uploadMode !== 'manual') {

                    e.currentTarget.style.background = '#EBEFF2'

                  }

                }}

                onMouseLeave={(e) => {

                  if (profileScreenshot) {

                    e.currentTarget.style.background = uploadMode === 'manual' ? '#000000' : '#F7F9FB'

                  }

                }}

              >

                <span style={{

                  fontFamily: 'Poppins',

                  fontStyle: 'normal',

                  fontWeight: 600,

                  fontSize: '12px',

                  lineHeight: '14px',

                  textAlign: 'center',

                  color: !profileScreenshot ? '#9CA3AF' : (uploadMode === 'manual' ? '#FFFFFF' : '#000000'),

                  flex: 'none',

                  order: 0,

                  flexGrow: 0,

                }}>

                  Update manually

                </span>

              </button>

            </div>



            {/* Divider Line - Figma: li (Grey 02) */}

            <div

              style={{

                position: 'absolute',

                height: '1px',

                left: '0px',

                right: '0px',

                top: '68px',

                background: '#EBEFF2',

              }}

            />



            {/* Content Area - Figma: Drag Area (Flat Grey) */}

            <div

              style={{

                // Auto layout

                display: 'flex',

                flexDirection: 'column',

                justifyContent: 'center',

                alignItems: 'center',

                padding: '32px',

                gap: '10px',

                

                // Positioning

                position: 'absolute',

                left: '0px',

                right: '0px',

                top: '68px',

                bottom: '0px',

                

                // Style - Flat Grey

                background: '#F8F8F8',

                borderRadius: '0px 0px 24px 24px',

                boxSizing: 'border-box',

              }}

            >

              {profileScreenshot && imagePreview ? (

                uploadMode === 'manual' ? (

                  // Manual Mode Confirmation View - Exact CSS from design

                  <div

                    style={{

                      boxSizing: 'border-box',

                      display: 'flex',

                      flexDirection: 'column',

                      justifyContent: 'center',

                      alignItems: 'center',

                      padding: '0px 32px',

                      gap: '8px',

                      width: '289px',

                      height: '481px',

                      border: '2px solid #DC2627',

                      borderRadius: '24px',

                    }}

                  >

                    {/* "Selected image" label - Exact CSS */}

                    <div

                      style={{

                        width: '225px',

                        height: '21px',

                        fontFamily: 'Poppins',

                        fontStyle: 'normal',

                        fontWeight: 500,

                        fontSize: '14px',

                        lineHeight: '21px',

                        textAlign: 'center',

                        color: '#242634',

                        opacity: 0.5,

                        flex: 'none',

                        order: 0,

                        alignSelf: 'stretch',

                        flexGrow: 0,

                      }}

                    >

                      Selected image

                    </div>



                    {/* thumb - Image display - Exact CSS */}

                    <div

                      style={{

                        width: '181px',

                        height: '356px',

                        borderRadius: '2px',

                        overflow: 'hidden',

                        flex: 'none',

                        order: 1,

                        flexGrow: 0,

                      }}

                    >

                      <img

                        src={imagePreview}

                        alt="Screenshot preview"

                        style={{

                          width: '100%',

                          height: '100%',

                          objectFit: 'cover',

                        }}

                      />

                    </div>



                    {/* Frame 760 - Button container - Exact CSS */}

                    <div

                      style={{

                        display: 'flex',

                        flexDirection: 'column',

                        alignItems: 'center',

                        padding: '0px',

                        gap: '4px',

                        width: '225px',

                        height: '50px',

                        flex: 'none',

                        order: 2,

                        alignSelf: 'stretch',

                        flexGrow: 0,

                      }}

                    >

                      {/* "Update stats manually" button - Exact CSS */}

                      <button

                        type="button"

                        onClick={handleConfirmManualMode}

                        style={{

                          display: 'flex',

                          flexDirection: 'row',

                          justifyContent: 'flex-end',

                          alignItems: 'center',

                          padding: '7px 20px',

                          gap: '10px',

                          width: '179px',

                          height: '28px',

                          background: '#DB161B',

                          borderRadius: '6px',

                          border: 'none',

                          cursor: 'pointer',

                          transition: 'all 0.2s ease',

                          flex: 'none',

                          order: 0,

                          flexGrow: 0,

                        }}

                        onMouseEnter={(e) => {

                          e.currentTarget.style.background = '#B91C1C'

                        }}

                        onMouseLeave={(e) => {

                          e.currentTarget.style.background = '#DB161B'

                        }}

                      >

                        {/* Label - Exact CSS */}

                        <span

                          style={{

                            width: '139px',

                            height: '14px',

                        fontFamily: 'Poppins',

                        fontStyle: 'normal',

                            fontWeight: 600,

                            fontSize: '11px',

                            lineHeight: '14px',

                        textAlign: 'center',

                            color: '#FFFFFF',

                            flex: 'none',

                            order: 0,

                            flexGrow: 0,

                          }}

                        >

                          Update stats manually

                        </span>

                      </button>



                      {/* Helper text - Exact CSS */}

                    <div

                      style={{

                          width: '225px',

                          height: '18px',

                        fontFamily: 'Poppins',

                        fontStyle: 'normal',

                        fontWeight: 400,

                          fontSize: '12px',

                          lineHeight: '18px',

                          textAlign: 'center',

                          color: '#242634',

                          opacity: 0.5,

                          flex: 'none',

                          order: 1,

                          alignSelf: 'stretch',

                          flexGrow: 0,

                        }}

                      >

                        Click to manually update the stats

                      </div>

                    </div>

                  </div>

                ) : uploadMode === 'extract' ? (

                  // Extract Mode Confirmation View - Exact CSS from design

                  <div

                    style={{

                      boxSizing: 'border-box',

                      display: 'flex',

                      flexDirection: 'column',

                      justifyContent: 'center',

                      alignItems: 'center',

                      padding: '0px 32px',

                      gap: '8px',

                      width: '289px',

                      height: '481px',

                      border: '2px solid #DC2627',

                      borderRadius: '24px',

                    }}

                  >

                    {/* "Selected image" label - Exact CSS */}

                    <div

                      style={{

                        width: '225px',

                        height: '21px',

                        fontFamily: 'Poppins',

                        fontStyle: 'normal',

                        fontWeight: 500,

                        fontSize: '14px',

                        lineHeight: '21px',

                        textAlign: 'center',

                        color: '#242634',

                        opacity: 0.5,

                        flex: 'none',

                        order: 0,

                        alignSelf: 'stretch',

                        flexGrow: 0,

                      }}

                    >

                      Selected image

                    </div>



                    {/* thumb - Image display - Exact CSS */}

                    <div

                      style={{

                        width: '181px',

                        height: '356px',

                        borderRadius: '2px',

                        overflow: 'hidden',

                        flex: 'none',

                        order: 1,

                        flexGrow: 0,

                      }}

                    >

                      <img

                        src={imagePreview}

                        alt="Screenshot preview"

                        style={{

                          width: '100%',

                          height: '100%',

                          objectFit: 'cover',

                        }}

                      />

                    </div>



                    {/* Frame 760 - Button container - Exact CSS */}

                    <div

                      style={{

                        display: 'flex',

                        flexDirection: 'column',

                        alignItems: 'center',

                        padding: '0px',

                        gap: '4px',

                        width: '225px',

                        height: '50px',

                        flex: 'none',

                        order: 2,

                        alignSelf: 'stretch',

                        flexGrow: 0,

                      }}

                    >

                      {/* "Extract stats" button - Exact CSS */}

                    <button

                      type="button"

                        onClick={handleConfirmExtractMode}

                      style={{

                        display: 'flex',

                        flexDirection: 'row',

                          justifyContent: 'flex-end',

                        alignItems: 'center',

                          padding: '7px 20px',

                        gap: '10px',

                          width: '179px',

                          height: '28px',

                          background: '#DB161B',

                        borderRadius: '6px',

                        border: 'none',

                        cursor: 'pointer',

                        transition: 'all 0.2s ease',

                          flex: 'none',

                          order: 0,

                          flexGrow: 0,

                      }}

                      onMouseEnter={(e) => {

                          e.currentTarget.style.background = '#B91C1C'

                      }}

                      onMouseLeave={(e) => {

                          e.currentTarget.style.background = '#DB161B'

                      }}

                    >

                        {/* Label - Exact CSS */}

                      <span

                        style={{

                            width: '139px',

                            height: '14px',

                          fontFamily: 'Poppins',

                          fontStyle: 'normal',

                          fontWeight: 600,

                            fontSize: '12px',

                            lineHeight: '14px',

                            textAlign: 'center',

                          color: '#FFFFFF',

                            flex: 'none',

                            order: 0,

                            flexGrow: 0,

                        }}

                      >

                          Extract stats

                      </span>

                    </button>



                      {/* Helper text - Exact CSS */}

                      <div

                        style={{

                          width: '225px',

                          height: '18px',

                          fontFamily: 'Poppins',

                          fontStyle: 'normal',

                          fontWeight: 400,

                          fontSize: '12px',

                          lineHeight: '18px',

                          textAlign: 'center',

                          color: '#242634',

                          opacity: 0.5,

                          flex: 'none',

                          order: 1,

                          alignSelf: 'stretch',

                          flexGrow: 0,

                        }}

                      >

                        Click to extract stats automatically

                      </div>

                    </div>

                  </div>

                ) : (

                  // Image Preview Mode - Figma: Wrap with content

                  <div

                  style={{

                    boxSizing: 'border-box',

                    

                    // Auto layout

                    display: 'flex',

                    flexDirection: 'column',

                    justifyContent: 'center',

                    alignItems: 'center',

                    padding: '0px 32px',

                    gap: '8px',

                    

                    // Exact Figma size for Wrap

                    width: isMobile ? '289px' : '336px',

                    height: isMobile ? '481px' : '560px',

                    

                      // Style - Red border for uploaded image

                      border: '2px solid #DC2627',

                    borderRadius: '24px',

                    background: '#FFFFFF',

                  }}

                >

                  {/* "Selected image" label - Figma specs */}

                  <div

                    style={{

                      width: isMobile ? '225px' : '272px',

                      height: '21px',

                      fontFamily: 'Poppins',

                      fontStyle: 'normal',

                      fontWeight: 500,

                      fontSize: '14px',

                      lineHeight: '21px',

                      textAlign: 'center',

                      color: '#242634',

                      opacity: 0.5,

                      flex: 'none',

                      order: 0,

                      alignSelf: 'stretch',

                      flexGrow: 0,

                    }}

                  >

                    Selected image

                  </div>



                  {/* Image Container - Figma: thumb with rounded corners */}

                  <div

                    style={{

                      width: isMobile ? '181px' : '220px',

                      height: isMobile ? '356px' : '420px',

                      borderRadius: '2px',

                      overflow: 'hidden',

                      backgroundColor: '#FFFFFF',

                      display: 'flex',

                      alignItems: 'center',

                      justifyContent: 'center',

                      flex: 'none',

                      order: 1,

                      flexGrow: 0,

                    }}

                  >

                    <img

                      src={imagePreview}

                      alt="Screenshot preview"

                      style={{

                        width: '100%',

                        height: '100%',

                        objectFit: 'cover',

                        display: 'block',

                      }}

                    />

                  </div>

                  

                  {/* Frame 760 - Button container */}

                  <div

                    style={{

                      // Auto layout

                      display: 'flex',

                      flexDirection: 'column',

                      alignItems: 'center',

                      padding: '0px',

                      gap: '4px',

                      

                      width: isMobile ? '225px' : '272px',

                      height: '50px',

                      

                      // Inside auto layout

                      flex: 'none',

                      order: 2,

                      alignSelf: 'stretch',

                      flexGrow: 0,

                    }}

                  >

                    {/* Instructions text */}

                    <div

                      style={{

                        width: isMobile ? '225px' : '272px',

                        fontFamily: 'Poppins',

                        fontStyle: 'normal',

                        fontWeight: 400,

                        fontSize: '12px',

                        lineHeight: '18px',

                        textAlign: 'center',

                        color: '#242634',

                        opacity: 0.7,

                        flex: 'none',

                        order: 1,

                        alignSelf: 'stretch',

                        flexGrow: 0,

                      }}

                    >

                      Choose "Extract stats" to auto-fill with OCR, or "Update manually" to enter values yourself

                    </div>

                  </div>

                </div>

                )

              ) : (

                // Dashed Upload Box (Original)

                <div

                  style={{

                    boxSizing: 'border-box',

                    

                    // Auto layout

                    display: 'flex',

                    flexDirection: 'column',

                    justifyContent: 'center',

                    alignItems: 'center',

                    padding: '0px 32px',

                    

                    // Size

                    width: '100%',

                    flex: 1,

                    

                    // Style

                    border: '2px dashed #E2E6EA',

                    borderRadius: '24px',

                    background: '#FFFFFF',

                    margin: '16px',

                    

                    cursor: 'pointer',

                    transition: 'all 0.2s ease',

                  }}

                  onMouseEnter={(e) => {

                    e.currentTarget.style.borderColor = '#DC2627'

                    e.currentTarget.style.background = 'rgba(220, 38, 39, 0.05)'

                  }}

                  onMouseLeave={(e) => {

                    e.currentTarget.style.borderColor = '#E2E6EA'

                    e.currentTarget.style.background = '#FFFFFF'

                  }}

                  onClick={() => {

                    const fileInput = document.getElementById('profile-screenshot-upload') as HTMLInputElement

                    if (fileInput) fileInput.click()

                  }}

                >

                  {/* Text - Figma specs */}

                  <p

                    style={{

                      // Typography - Figma specs

                      fontFamily: 'Poppins',

                      fontStyle: 'normal',

                      fontWeight: 400,

                      fontSize: '14px',

                      lineHeight: '21px',

                      textAlign: 'center',

                      

                      // Color - Grey 05

                      color: '#242634',

                      opacity: 0.5,

                      

                      // Reset

                      margin: 0,

                      whiteSpace: 'pre-line',

                    }}

                  >

                    Upload a screenshot of your Trainer Profile.

                  </p>

                </div>

              )}

            </div>



            {/* Close Button */}

            <button

              onClick={handleCloseUploadModal}

              style={{

                position: 'absolute',

                top: '12px',

                right: '12px',

                background: 'transparent',

                border: 'none',

                padding: '8px',

                cursor: 'pointer',

                display: 'flex',

                alignItems: 'center',

                justifyContent: 'center',

                zIndex: 1000,

              }}

            >

              <X size={20} color="#6b7280" />

            </button>

          </div>

        </div>

      )}



      {/* NEW: Review Stats Update Modal */}

      {showReviewModal && extractedStatsData && (

        <StatUpdateModal

          isOpen={showReviewModal}

          onConfirm={() => {

            // Apply the extracted stats to the form

            setProfileData(prev => ({

              ...prev,

              ...extractedStatsData

            }))

            setHasExtractedStats(true)

            setShowReviewModal(false)

            setShowReminderModal(true)

          }}

          onCancel={() => {

            setShowReviewModal(false)

            setExtractedStatsData(null)

          }}

          onReview={() => {}}

          changes={[

            ...(extractedStatsData.distance_walked !== undefined ? [{

              label: 'Distance Walked',

              oldValue: profileData.distance_walked ? `${profileData.distance_walked}` : '0',

              newValue: `${extractedStatsData.distance_walked}`,

              isDecrease: false

            }] : []),

            ...(extractedStatsData.pokemon_caught !== undefined ? [{

              label: 'Pokémon Caught',

              oldValue: profileData.pokemon_caught?.toLocaleString() || '0',

              newValue: extractedStatsData.pokemon_caught.toLocaleString(),

              isDecrease: false

            }] : []),

            ...(extractedStatsData.pokestops_visited !== undefined ? [{

              label: 'Pokéstops Visited',

              oldValue: profileData.pokestops_visited?.toLocaleString() || '0',

              newValue: extractedStatsData.pokestops_visited.toLocaleString(),

              isDecrease: false

            }] : []),

            ...(extractedStatsData.total_xp !== undefined ? [{

              label: 'Total XP',

              oldValue: profileData.total_xp?.toLocaleString() || '0',

              newValue: extractedStatsData.total_xp.toLocaleString(),

              isDecrease: false

            }] : []),

            ...(extractedStatsData.unique_pokedex_entries !== undefined ? [{

              label: 'Unique Pokédex Entries',

              oldValue: profileData.unique_pokedex_entries?.toString() || '0',

              newValue: extractedStatsData.unique_pokedex_entries.toString(),

              isDecrease: false

            }] : []),

          ]}

          hasDecreasingStats={false}

        />

      )}



      {/* NEW: Reminder Modal */}

      {showReminderModal && (

        <div style={{

          position: 'fixed',

          top: 0,

          left: 0,

          right: 0,

          bottom: 0,

          backgroundColor: 'rgba(0, 0, 0, 0.6)',

          display: 'flex',

          alignItems: 'center',

          justifyContent: 'center',

          zIndex: 10000,

          padding: '20px',

        }}>

          <div style={{

            position: 'relative',

            width: isMobile ? '356px' : '400px',

            height: '158px',

            background: '#FFFFFF',

            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',

            borderRadius: '20px',

          }}>

            <div

              style={{

                display: 'flex',

                flexDirection: 'column',

                alignItems: 'center',

                padding: '0px',

                gap: '24px',

                position: 'absolute',

                width: isMobile ? '355px' : '390px',

                height: '116px',

                left: isMobile ? 'calc(50% - 355px/2 + 0.5px)' : 'calc(50% - 390px/2)',

                top: 'calc(50% - 116px/2 - 0.63px)',

              }}

            >

              <div

                style={{

                  width: isMobile ? '330px' : '360px',

                  height: '54px',

                  flex: 'none',

                  order: 0,

                  flexGrow: 0,

                  position: 'relative',

                }}

              >

                <div

                  style={{

                    position: 'absolute',

                    width: '100%',

                    height: '54px',

                    left: 'calc(50% - 330px/2)',

                    top: '0px',

                    fontFamily: 'Poppins',

                    fontStyle: 'normal',

                    fontWeight: 500,

                    fontSize: '18px',

                    lineHeight: '27px',

                    textAlign: 'center',

                    color: '#000000',

                    display: 'flex',

                    alignItems: 'center',

                    justifyContent: 'center',

                  }}

                >

                  Don't forget to update Secondary Stats

                </div>

              </div>

              <div

                style={{

                  display: 'flex',

                  flexDirection: 'row',

                  alignItems: 'center',

                  padding: '0px',

                  gap: '8px',

                  width: '152px',

                  height: '38px',

                  flex: 'none',

                  order: 1,

                  flexGrow: 0,

                }}

              >

                <button

                  type="button"

                  onClick={() => {

                    setShowReminderModal(false)

                    // Scroll to secondary stats section

                    setTimeout(() => {

                      const secondaryStatsHeading = document.querySelector('.secondary-stats-heading')

                      if (secondaryStatsHeading) {

                        secondaryStatsHeading.scrollIntoView({ behavior: 'smooth', block: 'center' })

                      }

                    }, 100)

                  }}

                  style={{

                    display: 'flex',

                    flexDirection: 'row',

                    justifyContent: 'center',

                    alignItems: 'center',

                    padding: '8px 16px',

                    gap: '10px',

                    width: '152px',

                    height: '38px',

                    background: '#DC2627',

                    borderRadius: '6px',

                    border: 'none',

                    flex: 'none',

                    order: 0,

                    flexGrow: 0,

                    cursor: 'pointer',

                    transition: 'all 0.2s ease',

                  }}

                  onMouseEnter={(e) => {

                    e.currentTarget.style.background = '#B91C1C'

                  }}

                  onMouseLeave={(e) => {

                    e.currentTarget.style.background = '#DC2627'

                  }}

                >

                  <span

                    style={{

                      width: '40px',

                      height: '23px',

                      fontFamily: 'Poppins',

                      fontStyle: 'normal',

                      fontWeight: 600,

                      fontSize: '15px',

                      lineHeight: '23px',

                      color: '#FFFFFF',

                      flex: 'none',

                      order: 0,

                      flexGrow: 0,

                    }}

                  >

                    Okay

                  </span>

                </button>

              </div>

            </div>

          </div>

        </div>

      )}



      {/* Existing Modals */}

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

        confirmText="Okay"

      />



      {/* OCR Error Modal */}

      <ErrorModal

        isOpen={showOCRErrorModal}

        onClose={() => setShowOCRErrorModal(false)}

        title="Failed to extract stats"

        message="Failed to extract stats from image. Please enter stats manually"

        confirmText="Okay"

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

    

    {/* Freeze Overlay - Prevents interaction during OCR processing */}

    {showFreezeOverlay && (

      <div style={{

        position: 'fixed',

        top: 0,

        left: 0,

        right: 0,

        bottom: 0,

        backgroundColor: 'rgba(0, 0, 0, 0.7)',

        display: 'flex',

        flexDirection: 'column',

        alignItems: 'center',

        justifyContent: 'center',

        zIndex: 10000,

      }}>

        <div style={{

          fontFamily: 'Poppins',

          fontStyle: 'normal',

          fontWeight: 600,

          fontSize: '18px',

          lineHeight: '27px',

          color: '#FFFFFF',

          textAlign: 'center',

          marginBottom: '12px',

        }}>

          Extracting stats...

        </div>

        <div style={{

          fontFamily: 'Poppins',

          fontStyle: 'normal',

          fontWeight: 400,

          fontSize: '14px',

          lineHeight: '21px',

          color: '#E5E7EB',

          textAlign: 'center',

        }}>

          Please wait while we analyze your screenshot

        </div>

      </div>

    )}

    </>

  )

}