import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { profileService, type ProfileData, type ProfileWithMetadata } from '../../services/profileService'
import { useValuePropModal } from '../../hooks/useValuePropModal'
import { useMobile } from '../../hooks/useMobile'
import { MobileFooter } from '../layout/MobileFooter'
import { ValuePropModal } from '../upgrade/ValuePropModal'
import { SocialConnectModal } from '../social/SocialConnectModal'
import { WelcomeModal } from '../common/WelcomeModal'
import { LogOut } from 'lucide-react'
import './UserProfile.css'

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

export const UserProfile = () => {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileWithMetadata | null>(null)
  const [editData, setEditData] = useState<ProfileData | null>(null)
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<{id: string, name: string, url: string} | null>(null)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMobile()
  const { isOpen, closeValueProp, daysRemaining } = useValuePropModal()

  // Check if user is coming from profile setup
  useEffect(() => {
    const isFromSetup = location.state?.fromProfileSetup
    if (isFromSetup) {
      setShowWelcomeModal(true)
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location])

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await profileService.getProfile()
      if (error) {
        throw new Error(error.message)
      }
      setProfile(data)
      if (data) {
        setEditData(data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Error signing out:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    if (editData) {
      // Special handling for trainer_code to enforce 12-digit limit
      if (field === 'trainer_code') {
        // Remove any non-digit characters
        const digitsOnly = value.replace(/\D/g, '');
        
        // Limit to 12 digits maximum
        const limitedValue = digitsOnly.slice(0, 12);
        
        setEditData(prev => ({ ...prev!, [field]: limitedValue }))
      } else {
        setEditData(prev => ({ ...prev!, [field]: value }))
      }
    }
  }

  const handleCancelEdit = () => {
    // Check if there are any unsaved changes
    const hasChanges = profile && editData && (
      profile.trainer_name !== editData.trainer_name ||
      profile.country !== editData.country ||
      profile.trainer_code !== editData.trainer_code ||
      profile.trainer_code_private !== editData.trainer_code_private ||
      profile.social_links_private !== editData.social_links_private ||
      // Check for social platform changes
      Object.keys(editData).some(key => 
        key.startsWith('social_') && 
        profile[key as keyof typeof profile] !== editData[key as keyof typeof editData]
      )
    );

    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel and lose your changes?'
      );
      if (!confirmed) {
        return;
      }
    }

    setEditData(profile)
    setError(null)
    setSuccess(null)
    // Navigate back to the previous page
    navigate(-1);
  }

  const handleSave = async () => {
    if (!editData || !profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let updatedData = { ...editData };

      // Check if trainer name or country is being changed
      const isNameChanged = profile.trainer_name !== editData.trainer_name;
      const isCountryChanged = profile.country !== editData.country;

      // If only trainer name or country is changed, update last_name_change_date
      if (isNameChanged || isCountryChanged) {
        updatedData.last_name_change_date = new Date().toISOString();
      }

      // Ensure trainer code privacy is properly set
      updatedData.trainer_code_private = editData.trainer_code_private || false;
      
      // Ensure social links privacy is properly set
      updatedData.social_links_private = editData.social_links_private || false;

      // Update profile in database
      const { data, error } = await profileService.updateProfile(updatedData);
      
      if (error) {
        throw new Error('Failed to update profile: ' + error.message);
      }

      setProfile(data);
      setEditData(data);
      // Don't show success message for profile updates
      
      // Navigate back to the previous page
      navigate(-1);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSocialConnect = async (platform: string, url: string) => {
    if (!editData || !profile) return;

    setSaving(true);
    setError(null);
    // Don't clear success message here - let it persist for profile updates

    try {
      // Create updated data with the new social platform URL
      const updatedData = { 
        ...editData,
        [platform]: url // This will set the appropriate field (e.g., instagram, github, etc.)
      };

      // Update profile in database
      const { data, error } = await profileService.updateProfile(updatedData);
      
      if (error) {
        throw new Error('Failed to connect social platform: ' + error.message);
      }

      // Update local state
      setProfile(data);
      setEditData(data);
      // Don't show success message for social connections
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect social platform');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSocialModal = () => {
    setEditingPlatform(null); // Clear any editing state
    setIsSocialModalOpen(true);
  };

  const handleCloseSocialModal = () => {
    setIsSocialModalOpen(false);
    setEditingPlatform(null); // Clear editing state when closing
  };

  const handleEditPlatform = (platform: {id: string, name: string}) => {
    if (!editData) return;
    
    const currentUrl = editData[platform.id as keyof ProfileData] as string;
    setEditingPlatform({
      id: platform.id,
      name: platform.name,
      url: currentUrl || ''
    });
    setIsSocialModalOpen(true);
  };

  // Get connected social platforms with their icons
  const getConnectedPlatforms = () => {
    if (!editData) return [];
    
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
      { 
        id: 'facebook', 
        name: 'Facebook',
        icon: (
          <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="22.6666" cy="22.25" r="22" fill="black"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M23.8164 33.138L23.8043 33.1402L23.7261 33.1787L23.7041 33.1831L23.6887 33.1787L23.6106 33.1402C23.5989 33.1365 23.5901 33.1384 23.5842 33.1457L23.5798 33.1567L23.5611 33.6276L23.5666 33.6496L23.5776 33.6639L23.692 33.7453L23.7085 33.7497L23.7217 33.7453L23.8362 33.6639L23.8494 33.6463L23.8538 33.6276L23.8351 33.1578C23.8321 33.1461 23.8259 33.1395 23.8164 33.138ZM24.1079 33.0137L24.0936 33.0159L23.8901 33.1182L23.8791 33.1292L23.8758 33.1413L23.8956 33.6144L23.9011 33.6276L23.9099 33.6353L24.131 33.7376C24.145 33.7413 24.1556 33.7384 24.1629 33.7288L24.1673 33.7134L24.1299 33.0379C24.1263 33.0247 24.1189 33.0166 24.1079 33.0137ZM23.3213 33.0159C23.3164 33.0129 23.3106 33.012 23.3051 33.0132C23.2996 33.0144 23.2947 33.0178 23.2916 33.0225L23.285 33.0379L23.2476 33.7134C23.2483 33.7266 23.2545 33.7354 23.2663 33.7398L23.2828 33.7376L23.5039 33.6353L23.5149 33.6265L23.5193 33.6144L23.538 33.1413L23.5347 33.1281L23.5237 33.1171L23.3213 33.0159Z" fill="white"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M23.164 10.75C21.4132 10.75 19.7341 11.4455 18.4962 12.6835C17.2582 13.9214 16.5627 15.6005 16.5627 17.3513V19.4142L15.5725 18.6715C15.4569 18.5848 15.3254 18.5218 15.1854 18.4859C15.0455 18.45 14.8998 18.4421 14.7568 18.4625C14.6138 18.483 14.4762 18.5314 14.3518 18.605C14.2275 18.6786 14.1189 18.776 14.0322 18.8916C13.9455 19.0071 13.8825 19.1387 13.8466 19.2786C13.8107 19.4186 13.8028 19.5643 13.8232 19.7073C13.8437 19.8503 13.8921 19.9879 13.9657 20.1122C14.0393 20.2366 14.1367 20.3452 14.2523 20.4319L16.3053 21.9722C15.8168 23.2572 14.6252 24.6017 12.6966 25.7602C12.5701 25.8378 12.4604 25.94 12.374 26.0608C12.2877 26.1815 12.2264 26.3183 12.1938 26.4631C12.1612 26.6079 12.1579 26.7578 12.1842 26.9039C12.2104 27.0499 12.2657 27.1893 12.3467 27.3137C13.5767 29.1587 15.5285 30.5538 17.6629 30.5538C18.4078 30.5538 18.9865 31.0269 19.5597 31.4439C20.365 32.0281 21.4289 32.7542 23.164 32.7542C24.899 32.7542 25.9618 32.0292 26.7672 31.4439C27.3415 31.0258 27.9202 30.5538 28.665 30.5538C30.7994 30.5538 32.7512 29.1587 33.9812 27.3137C34.0623 27.1893 34.1175 27.0499 34.1438 26.9039C34.17 26.7578 34.1668 26.6079 34.1342 26.4631C34.1016 26.3183 34.0403 26.1815 33.9539 26.0608C33.8675 25.94 33.7579 25.8378 33.6314 25.7602C31.7027 24.6017 30.5112 23.2572 30.0227 21.9722L32.0757 20.4319C32.3091 20.2568 32.4634 19.9961 32.5047 19.7073C32.546 19.4184 32.4708 19.125 32.2957 18.8916C32.1206 18.6581 31.86 18.5038 31.5711 18.4625C31.2823 18.4213 30.9889 18.4964 30.7554 18.6715L29.7652 19.4142V17.3513C29.7652 15.6005 29.0697 13.9214 27.8318 12.6835C26.5938 11.4455 24.9147 10.75 23.164 10.75ZM18.7631 17.3513C18.7631 16.1841 19.2268 15.0647 20.0521 14.2394C20.8774 13.4141 21.9968 12.9504 23.164 12.9504C24.3311 12.9504 25.4505 13.4141 26.2758 14.2394C27.1012 15.0647 27.5648 16.1841 27.5648 17.3513V20.6519C27.5648 23.0702 29.1271 25.2827 31.4574 26.9616C30.5926 27.8649 29.5727 28.3534 28.665 28.3534C27.1489 28.3534 26.1741 29.1543 25.4744 29.6637C24.7659 30.1786 24.1795 30.5538 23.164 30.5538C22.1485 30.5538 21.561 30.1786 20.8535 29.6637C20.1549 29.1543 19.1801 28.3534 17.6629 28.3534C16.7541 28.3534 15.7353 27.8649 14.8706 26.9616C17.2008 25.2827 18.7631 23.0713 18.7631 20.6519V17.3513Z" fill="white"/>
          </svg>
        )
      },
      { 
        id: 'vimeo', 
        name: 'Vimeo',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z" />
          </svg>
        )
      },
      { 
        id: 'discord', 
        name: 'Discord',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
          </svg>
        )
      },
      { 
        id: 'snapchat', 
        name: 'Snapchat',
        icon: (
          <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="22.6666" cy="22.25" r="22" fill="black"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M23.8164 33.138L23.8043 33.1402L23.7261 33.1787L23.7041 33.1831L23.6887 33.1787L23.6106 33.1402C23.5989 33.1365 23.5901 33.1384 23.5842 33.1457L23.5798 33.1567L23.5611 33.6276L23.5666 33.6496L23.5776 33.6639L23.692 33.7453L23.7085 33.7497L23.7217 33.7453L23.8362 33.6639L23.8494 33.6463L23.8538 33.6276L23.8351 33.1578C23.8321 33.1461 23.8259 33.1395 23.8164 33.138ZM24.1079 33.0137L24.0936 33.0159L23.8901 33.1182L23.8791 33.1292L23.8758 33.1413L23.8956 33.6144L23.9011 33.6276L23.9099 33.6353L24.131 33.7376C24.145 33.7413 24.1556 33.7384 24.1629 33.7288L24.1673 33.7134L24.1299 33.0379C24.1263 33.0247 24.1189 33.0166 24.1079 33.0137ZM23.3213 33.0159C23.3164 33.0129 23.3106 33.012 23.3051 33.0132C23.2996 33.0144 23.2947 33.0178 23.2916 33.0225L23.285 33.0379L23.2476 33.7134C23.2483 33.7266 23.2545 33.7354 23.2663 33.7398L23.2828 33.7376L23.5039 33.6353L23.5149 33.6265L23.5193 33.6144L23.538 33.1413L23.5347 33.1281L23.5237 33.1171L23.3213 33.0159Z" fill="white"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M23.164 10.75C21.4132 10.75 19.7341 11.4455 18.4962 12.6835C17.2582 13.9214 16.5627 15.6005 16.5627 17.3513V19.4142L15.5725 18.6715C15.4569 18.5848 15.3254 18.5218 15.1854 18.4859C15.0455 18.45 14.8998 18.4421 14.7568 18.4625C14.6138 18.483 14.4762 18.5314 14.3518 18.605C14.2275 18.6786 14.1189 18.776 14.0322 18.8916C13.9455 19.0071 13.8825 19.1387 13.8466 19.2786C13.8107 19.4186 13.8028 19.5643 13.8232 19.7073C13.8437 19.8503 13.8921 19.9879 13.9657 20.1122C14.0393 20.2366 14.1367 20.3452 14.2523 20.4319L16.3053 21.9722C15.8168 23.2572 14.6252 24.6017 12.6966 25.7602C12.5701 25.8378 12.4604 25.94 12.374 26.0608C12.2877 26.1815 12.2264 26.3183 12.1938 26.4631C12.1612 26.6079 12.1579 26.7578 12.1842 26.9039C12.2104 27.0499 12.2657 27.1893 12.3467 27.3137C13.5767 29.1587 15.5285 30.5538 17.6629 30.5538C18.4078 30.5538 18.9865 31.0269 19.5597 31.4439C20.365 32.0281 21.4289 32.7542 23.164 32.7542C24.899 32.7542 25.9618 32.0292 26.7672 31.4439C27.3415 31.0258 27.9202 30.5538 28.665 30.5538C30.7994 30.5538 32.7512 29.1587 33.9812 27.3137C34.0623 27.1893 34.1175 27.0499 34.1438 26.9039C34.17 26.7578 34.1668 26.6079 34.1342 26.4631C34.1016 26.3183 34.0403 26.1815 33.9539 26.0608C33.8675 25.94 33.7579 25.8378 33.6314 25.7602C31.7027 24.6017 30.5112 23.2572 30.0227 21.9722L32.0757 20.4319C32.3091 20.2568 32.4634 19.9961 32.5047 19.7073C32.546 19.4184 32.4708 19.125 32.2957 18.8916C32.1206 18.6581 31.86 18.5038 31.5711 18.4625C31.2823 18.4213 30.9889 18.4964 30.7554 18.6715L29.7652 19.4142V17.3513C29.7652 15.6005 29.0697 13.9214 27.8318 12.6835C26.5938 11.4455 24.9147 10.75 23.164 10.75ZM18.7631 17.3513C18.7631 16.1841 19.2268 15.0647 20.0521 14.2394C20.8774 13.4141 21.9968 12.9504 23.164 12.9504C24.3311 12.9504 25.4505 13.4141 26.2758 14.2394C27.1012 15.0647 27.5648 16.1841 27.5648 17.3513V20.6519C27.5648 23.0702 29.1271 25.2827 31.4574 26.9616C30.5926 27.8649 29.5727 28.3534 28.665 28.3534C27.1489 28.3534 26.1741 29.1543 25.4744 29.6637C24.7659 30.1786 24.1795 30.5538 23.164 30.5538C22.1485 30.5538 21.561 30.1786 20.8535 29.6637C20.1549 29.1543 19.1801 28.3534 17.6629 28.3534C16.7541 28.3534 15.7353 27.8649 14.8706 26.9616C17.2008 25.2827 18.7631 23.0713 18.7631 20.6519V17.3513Z" fill="white"/>
          </svg>
        )
      },
      { 
        id: 'telegram', 
        name: 'Telegram',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        )
      },
      { 
        id: 'youtube', 
        name: 'YouTube',
        icon: (
          <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="22.3334" cy="22.5" r="22" fill="black"/>
            <path d="M22.8334 12.8999C23.8594 12.8999 24.9118 12.9263 25.9318 12.9695L27.1366 13.0271L28.2898 13.0955L29.3698 13.1687L30.3562 13.2455C31.4268 13.327 32.4343 13.7836 33.2013 14.535C33.9683 15.2864 34.4455 16.2844 34.549 17.3531L34.597 17.8631L34.687 18.9551C34.771 20.0867 34.8334 21.3203 34.8334 22.4999C34.8334 23.6795 34.771 24.9131 34.687 26.0447L34.597 27.1367L34.549 27.6467C34.4455 28.7156 33.9681 29.7137 33.2009 30.4651C32.4336 31.2166 31.4258 31.6731 30.355 31.7543L29.371 31.8299L28.291 31.9043L27.1366 31.9727L25.9318 32.0303C24.8996 32.075 23.8665 32.0982 22.8334 32.0999C21.8002 32.0982 20.7672 32.075 19.735 32.0303L18.5302 31.9727L17.377 31.9043L16.297 31.8299L15.3106 31.7543C14.24 31.6728 13.2324 31.2162 12.4654 30.4648C11.6984 29.7134 11.2212 28.7154 11.1178 27.6467L11.0698 27.1367L10.9798 26.0447C10.8884 24.8652 10.8395 23.6829 10.8334 22.4999C10.8334 21.3203 10.8958 20.0867 10.9798 18.9551L11.0698 17.8631L11.1178 17.3531C11.2212 16.2846 11.6982 15.2868 12.465 14.5354C13.2317 13.784 14.239 13.3272 15.3094 13.2455L16.2946 13.1687L17.3746 13.0955L18.529 13.0271L19.7338 12.9695C20.7664 12.9248 21.7998 12.9016 22.8334 12.8999ZM22.8334 15.2999C21.8434 15.2999 20.8246 15.3263 19.8334 15.3671L18.6598 15.4235L17.533 15.4895L16.4746 15.5615L15.505 15.6371C14.9952 15.6728 14.5146 15.8881 14.1486 16.2446C13.7825 16.6012 13.5548 17.076 13.5058 17.5847C13.3654 19.0355 13.2334 20.8415 13.2334 22.4999C13.2334 24.1583 13.3654 25.9643 13.5058 27.4151C13.6078 28.4615 14.4382 29.2751 15.505 29.3627L16.4746 29.4371L17.533 29.5091L18.6598 29.5763L19.8334 29.6327C20.8246 29.6735 21.8434 29.6999 22.8334 29.6999C23.8234 29.6999 24.8422 29.6735 25.8334 29.6327L27.007 29.5763L28.1338 29.5103L29.1922 29.4383L30.1618 29.3627C30.6715 29.327 31.1521 29.1117 31.5182 28.7552C31.8842 28.3986 32.112 27.9238 32.161 27.4151C32.3014 25.9643 32.4334 24.1583 32.4334 22.4999C32.4334 20.8415 32.3014 19.0355 32.161 17.5847C32.112 17.076 31.8842 16.6012 31.5182 16.2446C31.1521 15.8881 30.6715 15.6728 30.1618 15.6371L29.1922 15.5627L28.1338 15.4907L27.007 15.4235L25.8334 15.3671C24.8339 15.3242 23.8337 15.3018 22.8334 15.2999ZM20.4334 19.5899C20.4333 19.4726 20.4619 19.3571 20.5166 19.2534C20.5714 19.1496 20.6506 19.0609 20.7475 18.9947C20.8443 18.9286 20.9559 18.8872 21.0724 18.874C21.189 18.8608 21.307 18.8763 21.4162 18.9191L21.5134 18.9671L26.5534 21.8759C26.6537 21.9338 26.7386 22.0151 26.8009 22.1128C26.8631 22.2106 26.9008 22.3219 26.9108 22.4373C26.9209 22.5528 26.9029 22.6689 26.8584 22.7759C26.8139 22.8829 26.7443 22.9776 26.6554 23.0519L26.5534 23.1239L21.5134 26.0339C21.4118 26.0927 21.2974 26.1258 21.1801 26.1303C21.0628 26.1348 20.9462 26.1105 20.8405 26.0597C20.7347 26.0088 20.643 25.9328 20.5733 25.8384C20.5036 25.744 20.458 25.634 20.4406 25.5179L20.4334 25.4099V19.5899Z" fill="white"/>
          </svg>
        )
      },
      { 
        id: 'tiktok', 
        name: 'TikTok',
        icon: (
          <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="22.6666" cy="22.5" r="22" fill="black"/>
            <g clipPath="url(#clip0_521_19816)">
              <path d="M22.1666 20.3C20.7566 19.8796 19.2501 19.9142 17.8609 20.3989C16.4717 20.8835 15.2705 21.7936 14.428 22.9997C13.5854 24.2059 13.1444 25.6469 13.1675 27.1181C13.1906 28.5892 13.6766 30.0156 14.5566 31.1948C15.4366 32.374 16.6657 33.2459 18.0694 33.6867C19.4731 34.1275 20.9801 34.1148 22.3762 33.6503C23.7723 33.1859 24.9865 32.2934 25.8465 31.0996C26.7064 29.9058 27.1683 28.4713 27.1666 27V20C28.5 21.3333 30.5 22 33.1666 22V17C30.5 17 28.5 15.3333 27.1666 12H22.1666V27M22.1666 27C22.1666 26.6044 22.0493 26.2178 21.8296 25.8889C21.6098 25.56 21.2974 25.3036 20.932 25.1522C20.5665 25.0009 20.1644 24.9613 19.7764 25.0384C19.3885 25.1156 19.0321 25.3061 18.7524 25.5858C18.4727 25.8655 18.2822 26.2219 18.2051 26.6098C18.1279 26.9978 18.1675 27.3999 18.3189 27.7654C18.4702 28.1308 18.7266 28.4432 19.0555 28.6629C19.3844 28.8827 19.7711 29 20.1666 29C20.6971 29 21.2058 28.7893 21.5808 28.4142C21.9559 28.0391 22.1666 27.5304 22.1666 27Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <defs>
              <clipPath id="clip0_521_19816">
                <rect width="24" height="24" fill="white" transform="translate(11.1666 11)"/>
              </clipPath>
            </defs>
          </svg>
        )
      },
      { 
        id: 'twitch', 
        name: 'Twitch',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
          </svg>
        )
      },
      { 
        id: 'whatsapp', 
        name: 'WhatsApp',
        icon: (
          <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="22.3334" cy="22.75" r="22" fill="black"/>
            <path d="M23.545 34.7597L23.5318 34.7621L23.4466 34.8041L23.4226 34.8089L23.4058 34.8041L23.3206 34.7621C23.3078 34.7581 23.2982 34.7601 23.2918 34.7681L23.287 34.7801L23.2666 35.2937L23.2726 35.3177L23.2846 35.3333L23.4094 35.4221L23.4274 35.4269L23.4418 35.4221L23.5666 35.3333L23.581 35.3141L23.5858 35.2937L23.5654 34.7813C23.5622 34.7685 23.5554 34.7613 23.545 34.7597ZM23.863 34.6241L23.8474 34.6265L23.6254 34.7381L23.6134 34.7501L23.6098 34.7633L23.6314 35.2793L23.6374 35.2937L23.647 35.3021L23.8882 35.4137C23.9034 35.4177 23.915 35.4145 23.923 35.4041L23.9278 35.3873L23.887 34.6505C23.883 34.6361 23.875 34.6273 23.863 34.6241ZM23.005 34.6265C22.9997 34.6233 22.9934 34.6223 22.9873 34.6236C22.9813 34.625 22.976 34.6286 22.9726 34.6337L22.9654 34.6505L22.9246 35.3873C22.9254 35.4017 22.9322 35.4113 22.945 35.4161L22.963 35.4137L23.2042 35.3021L23.2162 35.2925L23.221 35.2793L23.2414 34.7633L23.2378 34.7489L23.2258 34.7369L23.005 34.6265Z" fill="white"/>
            <path d="M22.8334 9.25C29.461 9.25 34.8334 14.6224 34.8334 21.25C34.8334 27.8776 29.461 33.25 22.8334 33.25C20.7909 33.2529 18.7818 32.7323 16.9978 31.738L16.6318 31.5244L12.9934 32.5948C12.7954 32.6531 12.5858 32.6599 12.3844 32.6146C12.183 32.5692 11.9966 32.4732 11.8427 32.3355C11.6889 32.1979 11.5728 32.0233 11.5053 31.8282C11.4379 31.6331 11.4214 31.424 11.4574 31.2208L11.4886 31.09L12.559 27.4516C11.4274 25.5811 10.8306 23.4361 10.8334 21.25C10.8334 14.6224 16.2058 9.25 22.8334 9.25ZM22.8334 11.65C21.1145 11.6497 19.4271 12.1109 17.9474 12.9854C16.4676 13.8599 15.2498 15.1156 14.4211 16.6215C13.5924 18.1274 13.1832 19.8282 13.2362 21.5462C13.2892 23.2642 13.8026 24.9365 14.7226 26.3884C14.9602 26.7628 15.0622 27.2236 14.9818 27.6808L14.935 27.8764L14.4058 29.6776L16.207 29.1484C16.7266 28.9948 17.2666 29.0884 17.695 29.3608C18.953 30.1573 20.379 30.6503 21.8604 30.8008C23.3417 30.9513 24.8377 30.7552 26.2302 30.2279C27.6227 29.7006 28.8735 28.8567 29.8836 27.7627C30.8937 26.6688 31.6355 25.3549 32.0504 23.9249C32.4653 22.4949 32.5419 20.988 32.2741 19.5233C32.0063 18.0586 31.4014 16.6763 30.5074 15.4857C29.6133 14.295 28.4545 13.3286 27.1227 12.6629C25.7908 11.9972 24.3223 11.6504 22.8334 11.65ZM19.3558 15.4708C19.4888 15.4139 19.6342 15.3922 19.778 15.408C19.9218 15.4237 20.0591 15.4764 20.1766 15.5608C20.7814 16.0024 21.2614 16.5952 21.6742 17.1736L22.0666 17.7424L22.2502 18.0124C22.3565 18.1671 22.4087 18.3527 22.3988 18.5402C22.3888 18.7277 22.3171 18.9066 22.195 19.0492L22.105 19.1404L20.9962 19.9636C20.9434 20.0027 20.9063 20.0594 20.8916 20.1234C20.8769 20.1874 20.8854 20.2545 20.9158 20.3128C21.1678 20.7688 21.613 21.4492 22.1242 21.9604C22.6366 22.4716 23.3482 22.9468 23.8354 23.2264C23.941 23.2864 24.0682 23.2672 24.1546 23.1892L24.2002 23.1352L24.9214 22.0372C25.0536 21.8606 25.2491 21.7421 25.4669 21.7067C25.6847 21.6714 25.9077 21.7219 26.089 21.8476L26.7406 22.3024C27.3886 22.7644 28.0114 23.2612 28.5046 23.8912C28.5958 24.0096 28.6538 24.1502 28.6726 24.2985C28.6914 24.4468 28.6702 24.5974 28.6114 24.7348C28.1362 25.8436 26.9326 26.788 25.6822 26.7424L25.4914 26.7304L25.2622 26.7088L25.1326 26.692L24.847 26.644C23.7382 26.4352 21.961 25.8064 20.119 23.9656C18.2782 22.1236 17.6494 20.3464 17.4406 19.2376L17.3926 18.952L17.3626 18.7024L17.347 18.4924L17.3422 18.4024C17.2966 17.1496 18.2458 15.946 19.3558 15.4708Z" fill="white"/>
          </svg>
        )
      },
      { 
        id: 'reddit', 
        name: 'Reddit',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
          </svg>
        )
      },
    ];

    return platforms.filter(platform => editData[platform.id as keyof ProfileData]);
  };

  // Handle disconnecting a social platform
  const handleDisconnectPlatform = async (platform: string) => {
    if (!editData || !profile) return;

    setSaving(true);
    setError(null);
    // Don't clear success message here - let it persist for profile updates

    try {
      // Create updated data with the social platform URL removed
      const updatedData = { 
        ...editData,
        [platform]: '' // Clear the platform URL
      };

      // Update profile in database
      const { data, error } = await profileService.updateProfile(updatedData);
      
      if (error) {
        throw new Error('Failed to disconnect social platform: ' + error.message);
      }

      // Update local state
      setProfile(data);
      setEditData(data);
      // Don't show success message for social disconnections
      
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect social platform');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-content">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-content">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h3>No Profile Found</h3>
              <p>It seems you haven't completed your profile setup yet.</p>
              <button
                onClick={() => navigate('/profile-setup')}
                className="nav-button primary"
                style={{ marginTop: '1rem' }}
              >
                Complete Profile Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="profile-settings-container"
      style={{
        padding: isMobile ? "0px" : "2rem", // Remove padding on mobile
        alignItems: isMobile ? "flex-start" : "center", // Top align on mobile
        justifyContent: isMobile ? "flex-start" : "center", // Top align on mobile
      }}
    >
      <WelcomeModal 
        isOpen={showWelcomeModal}
        onContinue={() => setShowWelcomeModal(false)}
        userName={profile?.trainer_name}
      />

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

      {/* Messages */}
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

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: isMobile ? "8px" : "13px",
          width: isMobile ? "100%" : "838px",
          minWidth: isMobile ? "350px" : "auto", // Reduced for 414px devices
          maxWidth: isMobile ? "390px" : "100%", // Max width to fit in 414px viewport
          fontFamily: "Poppins, sans-serif",
          color: "#000000",
          margin: "0 auto",
          marginTop: isMobile ? "8px" : "20px", // Minimal top spacing for mobile header
          padding: "0px", // Removed padding
          boxSizing: "border-box",
        }}
      >
        {/* Profile Settings Header */}
        <h1
          style={{
            fontFamily: "Poppins",
            fontStyle: "normal",
            fontWeight: 600,
            fontSize: isMobile ? "20px" : "24px",
            lineHeight: isMobile ? "30px" : "36px",
            color: "#000000",
            width: "100%",
            textAlign: "center",
            margin: "0", // Remove default h1 margin
          }}
        >
          Profile Settings
        </h1>

        {/* Profile Form */}
        <form
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: isMobile ? "8px" : "13px",
            width: "100%",
            minWidth: isMobile ? "296px" : "auto", // 320px container - 24px padding
          }}
        >
          {/* Basic Info Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: isMobile ? "8px" : "13px",
              width: "100%",
              minWidth: isMobile ? "296px" : "auto",
            }}
          >
            {/* Email Address */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
                width: "100%",
                minWidth: isMobile ? "296px" : "auto",
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
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: isMobile ? "10px" : "9px",
                  gap: "10px",
                  width: "100%",
                  height: isMobile ? "44px" : "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "14px" : "12px",
                  lineHeight: isMobile ? "20px" : "18px",
                  color: "#000000",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            {/* Trainer Name */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
                width: "100%",
                minWidth: isMobile ? "296px" : "auto",
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
                Trainer Name
              </label>
              <input
                type="text"
                value={editData?.trainer_name || ''}
                onChange={(e) => handleInputChange('trainer_name', e.target.value)}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: isMobile ? "10px" : "9px",
                  gap: "10px",
                  width: "100%",
                  height: isMobile ? "44px" : "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "14px" : "12px",
                  lineHeight: isMobile ? "20px" : "18px",
                  color: "#000000",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            {/* Trainer Level */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
                width: "100%",
                minWidth: isMobile ? "296px" : "auto",
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
                Trainer Level
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={editData?.trainer_level || 1}
                onChange={(e) => handleInputChange('trainer_level', parseInt(e.target.value))}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: isMobile ? "10px" : "9px",
                  gap: "10px",
                  width: "100%",
                  height: isMobile ? "44px" : "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "14px" : "12px",
                  lineHeight: isMobile ? "20px" : "18px",
                  color: "#000000",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            {/* Trainer Code with Toggle */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "4px",
                width: "100%",
                minWidth: isMobile ? "296px" : "auto",
              }}
            >
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
                  Trainer Code
                </label>
                <input
                  type="text"
                  value={editData?.trainer_code || ''}
                  onChange={(e) => handleInputChange('trainer_code', e.target.value)}
                  maxLength={12}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: isMobile ? "10px" : "9px",
                    gap: "10px",
                    width: "100%",
                    height: isMobile ? "44px" : "36px",
                    background: "#FFFFFF",
                    border: editData?.trainer_code && editData.trainer_code.length < 12 ? "1px solid #ff375f" : "1px solid #848282",
                    borderRadius: "6px",
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: isMobile ? "14px" : "12px",
                    lineHeight: isMobile ? "20px" : "18px",
                    color: "#000000",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                {editData?.trainer_code && editData.trainer_code.length < 12 && (
                  <div style={{
                    fontSize: isMobile ? "12px" : "10px",
                    color: "#ff375f",
                    marginTop: "4px",
                    fontFamily: "Poppins"
                  }}>
                    Trainer code must be exactly 12 digits ({editData.trainer_code.length}/12)
                  </div>
                )}
              </div>

              {/* Keep trainer code private toggle */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  height: "28px",
                }}
              >
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 500,
                    fontSize: isMobile ? "12px" : "11px",
                    lineHeight: isMobile ? "18px" : "16px",
                    color: "#000000",
                  }}
                >
                  Keep trainer code private
                </span>
                <button
                  type="button"
                  onClick={() => handleInputChange('trainer_code_private', !editData?.trainer_code_private)}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "2px",
                    width: "44px",
                    height: "24px",
                    background: editData?.trainer_code_private ? "#DC2627" : "#E5E7EB",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    justifyContent: editData?.trainer_code_private ? "flex-end" : "flex-start",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div 
                    style={{
                      width: "20px",
                      height: "20px",
                      background: "#FFFFFF",
                      borderRadius: "50%",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "13px",
              width: "100%",
              minWidth: isMobile ? "296px" : "auto",
            }}
          >
            {/* Country */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
                width: "100%",
                minWidth: isMobile ? "296px" : "auto",
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
                Country
              </label>
              <select
                value={editData?.country || ''}
                onChange={(e) => handleInputChange('country', e.target.value)}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: isMobile ? "10px" : "9px",
                  gap: "10px",
                  width: "100%",
                  height: isMobile ? "44px" : "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "14px" : "12px",
                  lineHeight: isMobile ? "20px" : "18px",
                  color: "#000000",
                }}
              >
                <option value="">Choose your country</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Team Affiliation */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px",
                width: "100%",
                minWidth: isMobile ? "296px" : "auto",
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
                Team Affiliation
              </label>
              <select
                value={editData?.team_color || ''}
                onChange={(e) => handleInputChange('team_color', e.target.value)}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: isMobile ? "10px" : "9px",
                  gap: "10px",
                  width: "100%",
                  height: isMobile ? "44px" : "36px",
                  background: "#FFFFFF",
                  border: "1px solid #848282",
                  borderRadius: "6px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: isMobile ? "14px" : "12px",
                  lineHeight: isMobile ? "20px" : "18px",
                  color: "#000000",
                }}
              >
                <option value="">Choose your team</option>
                {TEAM_COLORS.map(team => (
                  <option key={team.value} value={team.value}>{team.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Social Platforms Section */}
          <div
            style={{ 
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "8px",
              width: "100%",
            }}
          >
            {/* Social Platforms Header */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                height: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "4px",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.8 6.13333L9.2 3.86667M4.8 7.86667L9.2 10.1333M1 7C1 7.53043 1.21071 8.03914 1.58579 8.41421C1.96086 8.78929 2.46957 9 3 9C3.53043 9 4.03914 8.78929 4.41421 8.41421C4.78929 8.03914 5 7.53043 5 7C5 6.46957 4.78929 5.96086 4.41421 5.58579C4.03914 5.21071 3.53043 5 3 5C2.46957 5 1.96086 5.21071 1.58579 5.58579C1.21071 5.96086 1 6.46957 1 7ZM9 3C9 3.53043 9.21071 4.03914 9.58579 4.41421C9.96086 4.78929 10.4696 5 11 5C11.5304 5 12.0391 4.78929 12.4142 4.41421C12.7893 4.03914 13 3.53043 13 3C13 2.46957 12.7893 1.96086 12.4142 1.58579C12.0391 1.21071 11.5304 1 11 1C10.4696 1 9.96086 1.21071 9.58579 1.58579C9.21071 1.96086 9 2.46957 9 3ZM9 11C9 11.5304 9.21071 12.0391 9.58579 12.4142C9.96086 12.7893 10.4696 13 11 13C11.5304 13 12.0391 12.7893 12.4142 12.4142C12.7893 12.0391 13 11.5304 13 11C13 10.4696 12.7893 9.96086 12.4142 9.58579C12.0391 9.21071 11.5304 9 11 9C10.4696 9 9.96086 9.21071 9.58579 9.58579C9.21071 9.96086 9 10.4696 9 11Z"
                      stroke="black"
                      strokeWidth="1.33333"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: isMobile ? "12px" : "11px",
                    lineHeight: isMobile ? "18px" : "16px",
                    color: "#000000",
                  }}
                >
                  Social Platforms
                </span>
              </div>
            </div>

            {/* Connected Social Platforms */}
            {getConnectedPlatforms().map((platform) => (
              <div
                key={platform.id}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  height: "40px",
                }}
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

            {/* Connect New Platform Button and Privacy Toggle Row */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                gap: "16px",
              }}
            >
              {/* Connect New Platform Button */}
              <button
                type="button"
                onClick={handleOpenSocialModal}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "9px 20px",
                  flex: 1,
                  height: isMobile ? "44px" : "36px",
                  background: "#F9FAFB",
                  border: "1px solid #6B7280",
                  borderRadius: "6px",
                  fontFamily: "Poppins",
                  fontStyle: "normal",
                  fontWeight: 500,
                  fontSize: isMobile ? "14px" : "12px",
                  lineHeight: isMobile ? "20px" : "18px",
                  color: "#000000",
                  cursor: "pointer",
                }}
              >
                + Connect New Social Platform
              </button>

              {/* Keep social links private toggle */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "Poppins",
                    fontStyle: "normal",
                    fontWeight: 500,
                    fontSize: isMobile ? "12px" : "11px",
                    lineHeight: isMobile ? "18px" : "16px",
                    color: "#000000",
                  }}
                >
                  Keep private
                </span>
                <button
                  type="button"
                  onClick={() => handleInputChange('social_links_private', !editData?.social_links_private)}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "2px",
                    width: "44px",
                    height: "24px",
                    background: editData?.social_links_private ? "#DC2627" : "#E5E7EB",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    justifyContent: editData?.social_links_private ? "flex-end" : "flex-start",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div 
                    style={{
                      width: "20px",
                      height: "20px",
                      background: "#FFFFFF",
                      borderRadius: "50%",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Profile Actions - Frame 666 */}
        <div
          style={{
            /* Frame 666 */
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            padding: "0px",
            gap: "8px",
            
            width: isMobile ? "353px" : "100%",
            height: isMobile ? "84px" : "auto",
            
            /* Inside auto layout */
            flex: "none",
            order: 1,
            alignSelf: "stretch",
            flexGrow: 0,
            
            /* Gap from social platforms section */
            marginTop: "8px",
          }}
        >
          {/* Save and Cancel buttons - Frame 665 */}
          <div
            style={{
              /* Frame 665 */
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0px",
              gap: "8px",
              
              width: isMobile ? "353px" : "100%",
              height: isMobile ? "38px" : "auto",
              
              /* Inside auto layout */
              flex: "none",
              order: 0,
              alignSelf: "stretch",
              flexGrow: 0,
            }}
          >
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                /* Component 47 */
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: isMobile ? "4px 8px" : "12px 24px",
                gap: "8px",
                
                margin: isMobile ? "0 auto" : "0",
                width: isMobile ? "170px" : "415px",
                height: isMobile ? "38px" : "48px",
                
                background: "#000000",
                borderRadius: "6px",
                
                /* Inside auto layout */
                flex: "none",
                order: 0,
                flexGrow: 0,
                
                border: "none",
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: isMobile ? 500 : 600,
                fontSize: isMobile ? "14px" : "16px",
                lineHeight: isMobile ? "21px" : "24px",
                color: "#FFFFFF",
                cursor: "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{
                /* Component 48 */
                boxSizing: "border-box",
                
                /* Auto layout */
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: isMobile ? "4px 8px" : "12px 24px",
                gap: "8px",
                
                margin: isMobile ? "0 auto" : "0",
                width: isMobile ? "170px" : "415px",
                height: isMobile ? "38px" : "48px",
                
                border: "1px solid #000000",
                borderRadius: "6px",
                
                /* Inside auto layout */
                flex: "none",
                order: 1,
                flexGrow: 0,
                
                background: "#FFFFFF",
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: isMobile ? 500 : 600,
                fontSize: isMobile ? "14px" : "16px",
                lineHeight: isMobile ? "21px" : "24px",
                color: "#000000",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>

          {/* Log out button - Component 46 */}
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              /* Component 46 */
              boxSizing: "border-box",
              
              /* Auto layout */
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              padding: isMobile ? "8px 24px" : "12px 24px",
              gap: "8px",
              
              width: isMobile ? "353px" : "100%",
              height: isMobile ? "38px" : "48px",
              
              border: "1px solid #000000",
              borderRadius: "6px",
              
              /* Inside auto layout */
              flex: "none",
              order: 1,
              alignSelf: "stretch",
              flexGrow: 0,
              
              background: "#FFFFFF",
              fontFamily: "Poppins",
              fontStyle: "normal",
              fontWeight: isMobile ? 600 : 600,
              fontSize: isMobile ? "14px" : "16px",
              lineHeight: isMobile ? "21px" : "24px",
              color: "#000000",
              cursor: "pointer",
            }}
          >
            <LogOut 
              style={{ 
                /* material-symbols:logout */
                width: "24px", 
                height: "24px",
                
                /* Inside auto layout */
                flex: "none",
                order: 0,
                flexGrow: 0,
                
                color: "#000000" 
              }} 
            />
            <span
              style={{
                /* Log out */
                width: isMobile ? "52px" : "auto",
                height: isMobile ? "21px" : "auto",
                
                fontFamily: "Poppins",
                fontStyle: "normal",
                fontWeight: 600,
                fontSize: isMobile ? "14px" : "16px",
                lineHeight: isMobile ? "21px" : "24px",
                color: "#000000",
                
                /* Inside auto layout */
                flex: "none",
                order: 1,
                flexGrow: 0,
                whiteSpace: "nowrap",
              }}
            >
              Log out
            </span>
          </button>
        </div>
      </div>
      
      {/* Mobile Footer */}
      <MobileFooter currentPage="profile" />
    </div>
  )
}