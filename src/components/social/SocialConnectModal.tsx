"use client"

import React, { useState } from "react"
import { X } from "lucide-react"
import type { JSX } from "react" // Declaring JSX variable

interface SocialPlatform {
  id: string
  name: string
  icon: JSX.Element
  placeholder: string
  urlPrefix?: string
  isGray?: boolean
}

const socialPlatforms: SocialPlatform[] = [
  {
    id: "github",
    name: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    placeholder: "Profile URL",
    urlPrefix: "https://github.com/",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-9 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    placeholder: "Profile URL",
  },
  {
    id: "vimeo",
    name: "Vimeo",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z" />
      </svg>
    ),
    placeholder: "Profile URL",
  },
  {
    id: "discord",
    name: "Discord",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-5 fill-white">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
      </svg>
    ),
    placeholder: "Profile URL",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: (
      <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22.3333" cy="22.25" r="22" fill="black"/>
        <path d="M17.5033 10.75H27.1633C30.8433 10.75 33.8333 13.74 33.8333 17.42V27.08C33.8333 28.849 33.1305 30.5455 31.8797 31.7964C30.6288 33.0473 28.9322 33.75 27.1633 33.75H17.5033C13.8233 33.75 10.8333 30.76 10.8333 27.08V17.42C10.8333 15.651 11.536 13.9545 12.7868 12.7036C14.0377 11.4527 15.7343 10.75 17.5033 10.75ZM17.2733 13.05C16.1753 13.05 15.1222 13.4862 14.3458 14.2626C13.5694 15.039 13.1333 16.092 13.1333 17.19V27.31C13.1333 29.5985 14.9848 31.45 17.2733 31.45H27.3933C28.4912 31.45 29.5443 31.0138 30.3207 30.2374C31.0971 29.461 31.5333 28.408 31.5333 27.31V17.19C31.5333 14.9015 29.6818 13.05 27.3933 13.05H17.2733ZM28.3708 14.775C28.752 14.775 29.1176 14.9265 29.3872 15.196C29.6568 15.4656 29.8083 15.8313 29.8083 16.2125C29.8083 16.5937 29.6568 16.9594 29.3872 17.229C29.1176 17.4985 28.752 17.65 28.3708 17.65C27.9895 17.65 27.6239 17.4985 27.3543 17.229C27.0847 16.9594 26.9333 16.5937 26.9333 16.2125C26.9333 15.8313 27.0847 15.4656 27.3543 15.196C27.6239 14.9265 27.9895 14.775 28.3708 14.775ZM22.3333 16.5C23.8582 16.5 25.3208 17.1058 26.3991 18.1841C27.4774 19.2625 28.0833 20.725 28.0833 22.25C28.0833 23.775 27.4774 25.2375 26.3991 26.3159C25.3208 27.3942 23.8582 28 22.3333 28C20.8083 28 19.3457 27.3942 18.2674 26.3159C17.1891 25.2375 16.5833 23.775 16.5833 22.25C16.5833 20.725 17.1891 19.2625 18.2674 18.1841C19.3457 17.1058 20.8083 16.5 22.3333 16.5ZM22.3333 18.8C21.4183 18.8 20.5407 19.1635 19.8937 19.8105C19.2467 20.4575 18.8833 21.335 18.8833 22.25C18.8833 23.165 19.2467 24.0425 19.8937 24.6895C20.5407 25.3365 21.4183 25.7 22.3333 25.7C23.2482 25.7 24.1258 25.3365 24.7728 24.6895C25.4198 24.0425 25.7833 23.165 25.7833 22.25C25.7833 21.335 25.4198 20.4575 24.7728 19.8105C24.1258 19.1635 23.2482 18.8 22.3333 18.8Z" fill="white"/>
      </svg>
    ),
    placeholder: "Profile URL",
    urlPrefix: "https://instagram.com/",
    isGray: false, // Updated since the new SVG has its own black background
  },
  {
    id: "snapchat",
    name: "Snapchat",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.404-5.958 1.404-5.958s-.359-.719-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-12C24.007 5.367 18.641.001.017 0z" />
      </svg>
    ),
    placeholder: "Profile URL",
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-7 fill-white">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    placeholder: "Profile URL",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-5 fill-white">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    placeholder: "Profile URL",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-6 fill-none stroke-white stroke-2">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    ),
    placeholder: "Profile URL",
    urlPrefix: "https://tiktok.com/@",
  },
  {
    id: "twitch",
    name: "Twitch",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
      </svg>
    ),
    placeholder: "Profile URL",
    urlPrefix: "https://twitch.tv/",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
      </svg>
    ),
    placeholder: "Profile URL",
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    placeholder: "Profile URL",
    urlPrefix: "https://reddit.com/u/",
  },
]

interface SocialConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (platform: string, url: string) => void
  editingPlatform?: {id: string, name: string, url: string} | null
}

export function SocialConnectModal({ isOpen, onClose, onConnect, editingPlatform }: SocialConnectModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null)
  const [profileUrl, setProfileUrl] = useState("")

  // Handle editing mode - pre-select platform and URL
  React.useEffect(() => {
    if (editingPlatform && isOpen) {
      const platform = socialPlatforms.find(p => p.id === editingPlatform.id);
      if (platform) {
        setSelectedPlatform(platform);
        setProfileUrl(editingPlatform.url);
      }
    } else if (!editingPlatform && isOpen) {
      // Reset for new connections
      setSelectedPlatform(null);
      setProfileUrl("");
    }
  }, [editingPlatform, isOpen]);

  if (!isOpen) return null

  const handlePlatformSelect = (platform: SocialPlatform) => {
    setSelectedPlatform(platform)
    setProfileUrl("")
  }

  const handleConnect = () => {
    if (selectedPlatform && profileUrl.trim()) {
      const fullUrl = selectedPlatform.urlPrefix
        ? `${selectedPlatform.urlPrefix}${profileUrl.trim()}`
        : profileUrl.trim()
      onConnect(selectedPlatform.id, fullUrl)
      handleClose()
    }
  }

  const handleClose = () => {
    setSelectedPlatform(null)
    setProfileUrl("")
    onClose()
  }


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-lg"
        style={{
          width: "351px",
          height: selectedPlatform ? "220px" : "393px",
        }}
      >
        {!selectedPlatform ? (
          // Platform Selection Modal
          <div className="relative w-full h-full">
            <div
              className="absolute flex flex-col items-start"
              style={{
                width: "317px",
                height: "45px",
                left: "calc(50% - 317px/2 + 0.5px)",
                top: "19px",
              }}
            >
              <div className="flex flex-col items-start gap-1 w-full h-full">
                <h2
                  className="w-full h-6 font-semibold text-base leading-6 text-black"
                  style={{ fontFamily: "Poppins" }}
                >
                  {editingPlatform ? 'Edit Social Platform' : 'Connect Social Platform'}
                </h2>
                <p className="w-full h-4 font-normal text-xs leading-4 text-black" style={{ fontFamily: "Poppins" }}>
                  {editingPlatform ? 'Choose a platform to edit' : 'Choose a platform to connect to your profile'}
                </p>
              </div>
            </div>

            <button onClick={handleClose} className="absolute w-6 h-6" style={{ left: "323px", top: "13px" }}>
              <X className="h-4 w-4 text-black" strokeWidth={1.5} />
            </button>

            <div className="absolute" style={{ width: "195px", height: "262px", left: "78px", top: "90px" }}>
              <div className="grid grid-cols-3 gap-x-[31.33px] gap-y-[28.25px]">
                {socialPlatforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => handlePlatformSelect(platform)}
                    className={`flex items-center justify-center rounded-full transition-opacity hover:opacity-80`}
                    style={{
                      width: "44px",
                      height: "44px",
                      backgroundColor: platform.isGray ? "#848282" : "#000000",
                    }}
                  >
                    {platform.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // URL Input Modal
          <div className="relative w-full h-full">
            {/* Frame 703 - Main content container */}
            <div
              className="absolute flex flex-col items-center"
              style={{
                padding: "0px",
                gap: "16px",
                width: "320px",
                height: "159px",
                left: "16px",
                top: "calc(50% - 159px/2 + 0.5px)",
              }}
            >
              {/* Frame 691 & 697 - Header section */}
              <div
                className="flex flex-col items-start w-full"
                style={{
                  padding: "0px",
                  gap: "4px",
                  width: "320px",
                  height: "45px",
                }}
              >
                <h2
                  className="w-full text-black"
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "16px",
                    lineHeight: "24px",
                    height: "24px",
                  }}
                >
                  {editingPlatform ? 'Edit' : 'Connect'} {selectedPlatform.name}
                </h2>
                <p
                  className="w-full text-black"
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "16px",
                    height: "17px",
                  }}
                >
                  {editingPlatform ? 'Update your username or profile URL' : 'Enter your username or profile URL'}
                </p>
              </div>

              {/* Frame 702 - Icon and input row */}
              <div
                className="flex flex-row items-center w-full"
                style={{
                  padding: "0px",
                  gap: "8px",
                  width: "320px",
                  height: "44px",
                }}
              >
                {/* Group 384 - Icon container */}
                <div
                  className="relative flex items-center justify-center rounded-full"
                  style={{
                    width: "44px",
                    height: "44px",
                    backgroundColor: selectedPlatform.isGray ? "#848282" : "#000000",
                  }}
                >
                  {selectedPlatform.icon}
                </div>

                {/* Frame 654 - Input field */}
                <div
                  className="flex flex-row items-center box-border"
                  style={{
                    padding: "9px",
                    gap: "10px",
                    width: "268px",
                    height: "38px",
                    border: "1px solid #848282",
                    borderRadius: "6px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Profile URL"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    className="w-full h-full bg-transparent border-none outline-none text-black placeholder-gray-500"
                    style={{
                      fontFamily: "Poppins",
                      fontWeight: 400,
                      fontSize: "11px",
                      lineHeight: "16px",
                      color: profileUrl ? "#000000" : "#616161",
                    }}
                  />
                </div>
              </div>

              {/* Component 49 - Connect button */}
              <button
                onClick={handleConnect}
                disabled={!profileUrl.trim()}
                className="flex flex-row justify-center items-center w-full disabled:opacity-50"
                style={{
                  padding: "4px 8px",
                  gap: "8px",
                  width: "320px",
                  height: "38px",
                  backgroundColor: "#DC2627",
                  borderRadius: "6px",
                }}
              >
                <span
                  className="text-white"
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 500,
                    fontSize: "14px",
                    lineHeight: "21px",
                    width: "61px",
                    height: "21px",
                  }}
                >
                  {editingPlatform ? 'Update' : 'Connect'}
                </span>
              </button>
            </div>

            {/* Close button - iconoir:cancel */}
            <button
              onClick={handleClose}
              className="absolute"
              style={{
                width: "24px",
                height: "24px",
                left: "323px",
                top: "13px",
              }}
            >
              <X className="h-4 w-4 text-black" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
