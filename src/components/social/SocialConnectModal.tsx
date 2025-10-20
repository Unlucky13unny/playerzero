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
    id: "x",
    name: "X (Twitter)",
    icon: <img src="/images/x.svg" alt="X (Twitter)" width="45" height="45" />,
    placeholder: "Handle",
    urlPrefix: "https://x.com/",
  },
  {
    id: "bluesky",
    name: "Bluesky",
    icon: <img src="/images/bluesky.svg" alt="Bluesky" width="45" height="45" />,
    placeholder: "Handle",
    urlPrefix: "https://bsky.app/profile/",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: (
      <svg width="45" height="44" viewBox="0 0 45 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22.3334" cy="22" r="22" fill="black"/>
        <path d="M24.9478 44.0006V28.2209H29.9009L30.6371 22.0426H24.9478V18.1073C24.9478 16.3245 25.41 15.1038 27.7907 15.1038H30.8073V9.59557C29.3396 9.42518 27.8642 9.34354 26.3881 9.35106C22.01 9.35106 19.0042 12.2236 19.0042 17.497V22.0311H14.0834V28.2093H19.0149V44.0006H24.9478Z" fill="white"/>
      </svg>
    ),
    placeholder: "Handle",
    urlPrefix: "https://www.facebook.com/",
  },
  {
    id: "discord",
    name: "Discord",
    icon: (
      <svg width="44" height="45" viewBox="0 0 44 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22" cy="22.25" r="22" fill="black"/>
        <path d="M30.6749 15.2459C29.1791 14.5485 27.5595 14.0424 25.8724 13.75C25.8428 13.7504 25.8145 13.7626 25.7937 13.7837C25.5912 14.1549 25.3551 14.6385 25.1976 15.0097C23.4082 14.7399 21.5884 14.7399 19.799 15.0097C19.6415 14.6273 19.4053 14.1549 19.1917 13.7837C19.1804 13.7612 19.1467 13.75 19.1129 13.75C17.4259 14.0424 15.8175 14.5485 14.3104 15.2459C14.2992 15.2459 14.2879 15.2571 14.2767 15.2684C11.2175 19.8459 10.3739 24.2998 10.7901 28.7086C10.7901 28.7311 10.8013 28.7536 10.8238 28.7649C12.8483 30.2495 14.794 31.1492 16.7173 31.7453C16.751 31.7566 16.7848 31.7453 16.796 31.7228C17.2459 31.1043 17.6508 30.4519 17.9995 29.7659C18.022 29.7209 17.9995 29.6759 17.9545 29.6646C17.3134 29.4172 16.706 29.1248 16.1099 28.7874C16.065 28.7649 16.065 28.6974 16.0987 28.6636C16.2224 28.5737 16.3461 28.4724 16.4699 28.3825C16.4924 28.36 16.5261 28.36 16.5486 28.3712C20.4176 30.137 24.5903 30.137 28.4143 28.3712C28.4368 28.36 28.4705 28.36 28.493 28.3825C28.6167 28.4837 28.7404 28.5737 28.8641 28.6749C28.9091 28.7086 28.9091 28.7761 28.8529 28.7986C28.268 29.1473 27.6495 29.4284 27.0084 29.6759C26.9634 29.6871 26.9521 29.7434 26.9634 29.7771C27.3233 30.4632 27.7282 31.1155 28.1668 31.7341C28.2006 31.7453 28.2343 31.7566 28.2681 31.7453C30.2025 31.1492 32.1483 30.2495 34.1728 28.7649C34.1953 28.7536 34.2065 28.7311 34.2065 28.7086C34.7014 23.6137 33.3855 19.1936 30.7199 15.2684C30.7087 15.2571 30.6974 15.2459 30.6749 15.2459ZM18.5843 26.0206C17.4259 26.0206 16.4586 24.9521 16.4586 23.6362C16.4586 22.3203 17.4034 21.2518 18.5843 21.2518C19.7765 21.2518 20.7213 22.3315 20.71 23.6362C20.71 24.9521 19.7653 26.0206 18.5843 26.0206ZM26.4235 26.0206C25.2651 26.0206 24.2978 24.9521 24.2978 23.6362C24.2978 22.3203 25.2426 21.2518 26.4235 21.2518C27.6157 21.2518 28.5605 22.3315 28.5492 23.6362C28.5492 24.9521 27.6157 26.0206 26.4235 26.0206Z" fill="white"/>
      </svg>
    ),
    placeholder: "Handle",
    urlPrefix: "", // Discord doesn't use URL prefix
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
    placeholder: "Handle",
    urlPrefix: "https://www.instagram.com/",
    isGray: false,
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: (
      <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22.3334" cy="22.5" r="22" fill="black"/>
        <path d="M22.8334 12.8999C23.8594 12.8999 24.9118 12.9263 25.9318 12.9695L27.1366 13.0271L28.2898 13.0955L29.3698 13.1687L30.3562 13.2455C31.4268 13.327 32.4343 13.7836 33.2013 14.535C33.9683 15.2864 34.4455 16.2844 34.549 17.3531L34.597 17.8631L34.687 18.9551C34.771 20.0867 34.8334 21.3203 34.8334 22.4999C34.8334 23.6795 34.771 24.9131 34.687 26.0447L34.597 27.1367L34.549 27.6467C34.4455 28.7156 33.9681 29.7137 33.2009 30.4651C32.4336 31.2166 31.4258 31.6731 30.355 31.7543L29.371 31.8299L28.291 31.9043L27.1366 31.9727L25.9318 32.0303C24.8996 32.075 23.8665 32.0982 22.8334 32.0999C21.8002 32.0982 20.7672 32.075 19.735 32.0303L18.5302 31.9727L17.377 31.9043L16.297 31.8299L15.3106 31.7543C14.24 31.6728 13.2324 31.2162 12.4654 30.4648C11.6984 29.7134 11.2212 28.7154 11.1178 27.6467L11.0698 27.1367L10.9798 26.0447C10.8884 24.8652 10.8395 23.6829 10.8334 22.4999C10.8334 21.3203 10.8958 20.0867 10.9798 18.9551L11.0698 17.8631L11.1178 17.3531C11.2212 16.2846 11.6982 15.2868 12.465 14.5354C13.2317 13.784 14.239 13.3272 15.3094 13.2455L16.2946 13.1687L17.3746 13.0955L18.529 13.0271L19.7338 12.9695C20.7664 12.9248 21.7998 12.9016 22.8334 12.8999ZM22.8334 15.2999C21.8434 15.2999 20.8246 15.3263 19.8334 15.3671L18.6598 15.4235L17.533 15.4895L16.4746 15.5615L15.505 15.6371C14.9952 15.6728 14.5146 15.8881 14.1486 16.2446C13.7825 16.6012 13.5548 17.076 13.5058 17.5847C13.3654 19.0355 13.2334 20.8415 13.2334 22.4999C13.2334 24.1583 13.3654 25.9643 13.5058 27.4151C13.6078 28.4615 14.4382 29.2751 15.505 29.3627L16.4746 29.4371L17.533 29.5091L18.6598 29.5763L19.8334 29.6327C20.8246 29.6735 21.8434 29.6999 22.8334 29.6999C23.8234 29.6999 24.8422 29.6735 25.8334 29.6327L27.007 29.5763L28.1338 29.5103L29.1922 29.4383L30.1618 29.3627C30.6715 29.327 31.1521 29.1117 31.5182 28.7552C31.8842 28.3986 32.112 27.9238 32.161 27.4151C32.3014 25.9643 32.4334 24.1583 32.4334 22.4999C32.4334 20.8415 32.3014 19.0355 32.161 17.5847C32.112 17.076 31.8842 16.6012 31.5182 16.2446C31.1521 15.8881 30.6715 15.6728 30.1618 15.6371L29.1922 15.5627L28.1338 15.4907L27.007 15.4235L25.8334 15.3671C24.8339 15.3242 23.8337 15.3018 22.8334 15.2999ZM20.4334 19.5899C20.4333 19.4726 20.4619 19.3571 20.5166 19.2534C20.5714 19.1496 20.6506 19.0609 20.7475 18.9947C20.8443 18.9286 20.9559 18.8872 21.0724 18.874C21.189 18.8608 21.307 18.8763 21.4162 18.9191L21.5134 18.9671L26.5534 21.8759C26.6537 21.9338 26.7386 22.0151 26.8009 22.1128C26.8631 22.2106 26.9008 22.3219 26.9108 22.4373C26.9209 22.5528 26.9029 22.6689 26.8584 22.7759C26.8139 22.8829 26.7443 22.9776 26.6554 23.0519L26.5534 23.1239L21.5134 26.0339C21.4118 26.0927 21.2974 26.1258 21.1801 26.1303C21.0628 26.1348 20.9462 26.1105 20.8405 26.0597C20.7347 26.0088 20.643 25.9328 20.5733 25.8384C20.5036 25.744 20.458 25.634 20.4406 25.5179L20.4334 25.4099V19.5899Z" fill="white"/>
      </svg>
    ),
    placeholder: "Handle",
    urlPrefix: "https://www.youtube.com/@",
  },
  {
    id: "tiktok",
    name: "TikTok",
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
    ),
    placeholder: "Handle",
    urlPrefix: "https://www.tiktok.com/@",
  },
  {
    id: "twitch",
    name: "Twitch",
    icon: (
      <svg width="44" height="45" viewBox="0 0 44 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22" cy="22.75" r="22" fill="black"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M13.047 12.25L11.5 16.026V31.459H17V34.25H20.093L23.015 31.459H27.485L33.5 25.712V12.25H13.047ZM31.437 24.728L28 28.01H22.5L19.578 30.801V28.011H14.938V14.22H31.437V24.728ZM28 17.997V23.737H25.937V17.997H28ZM22.5 17.997V23.737H20.438V17.997H22.5Z" fill="white"/>
      </svg>
    ),
    placeholder: "Handle",
    urlPrefix: "https://www.twitch.tv/",
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: (
      <img src="/images/reddit.svg" alt="Reddit" width="45" height="45" />
    ),
    placeholder: "Handle",
    urlPrefix: "https://www.reddit.com/user/",
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
  const [validationError, setValidationError] = useState("")

  // Handle editing mode - pre-select platform and URL
  React.useEffect(() => {
    if (editingPlatform && isOpen) {
      const platform = socialPlatforms.find(p => p.id === editingPlatform.id);
      if (platform) {
        setSelectedPlatform(platform);
        // Extract handle from URL for editing
        let handle = editingPlatform.url;
        if (platform.urlPrefix && editingPlatform.url.startsWith(platform.urlPrefix)) {
          handle = editingPlatform.url.substring(platform.urlPrefix.length);
        }
        // Remove @ symbol if present
        if (handle.startsWith('@')) {
          handle = handle.substring(1);
        }
        setProfileUrl(handle);
      }
    } else if (!editingPlatform && isOpen) {
      // Reset for new connections
      setSelectedPlatform(null);
      setProfileUrl("");
      setValidationError("");
    }
  }, [editingPlatform, isOpen]);

  if (!isOpen) return null

  const handlePlatformSelect = (platform: SocialPlatform) => {
    setSelectedPlatform(platform)
    setProfileUrl("")
    setValidationError("")
  }

  const validateHandle = (handle: string): boolean => {
    // Only allow letters, numbers, underscores, and periods
    const validPattern = /^[A-Za-z0-9_.]+$/;
    if (!validPattern.test(handle)) {
      setValidationError("Only letters, numbers, underscores, and periods are allowed. Don't include @ or links.");
      return false;
    }
    setValidationError("");
    return true;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();
    
    // Remove @ symbol if user includes it
    if (value.startsWith('@')) {
      value = value.substring(1);
    }
    
    // Remove URL prefixes if user pastes a full URL
    if (selectedPlatform?.urlPrefix && value.startsWith(selectedPlatform.urlPrefix)) {
      value = value.substring(selectedPlatform.urlPrefix.length);
    }
    
    // Remove any http:// or https:// prefixes
    value = value.replace(/^https?:\/\//, '');
    
    // Remove common domain patterns
    value = value.replace(/^(www\.)?(facebook|instagram|tiktok|youtube|reddit|twitch|twitter|x|bsky)\.com\/@?/, '');
    value = value.replace(/^bsky\.app\/profile\//, '');
    
    setProfileUrl(value);
    
    if (value) {
      validateHandle(value);
    } else {
      setValidationError("");
    }
  }

  const handleConnect = async () => {
    if (!selectedPlatform || !profileUrl.trim()) return;
    
    const handle = profileUrl.trim();
    
    // Validate handle
    if (!validateHandle(handle)) {
      return;
    }

    // Special handling for Discord - copy to clipboard
    if (selectedPlatform.id === 'discord') {
      try {
        await navigator.clipboard.writeText(`@${handle}`);
        // Store just the handle for Discord
        onConnect(selectedPlatform.id, handle);
        handleClose();
        // You might want to show a success message here
        alert('Discord handle copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        // Fallback: still save the handle
        onConnect(selectedPlatform.id, handle);
        handleClose();
      }
      return;
    }

    // For other platforms, construct the full URL
    const fullUrl = selectedPlatform.urlPrefix
      ? `${selectedPlatform.urlPrefix}${handle}`
      : handle;
      
    onConnect(selectedPlatform.id, fullUrl);
    handleClose();
  }

  const handleClose = () => {
    setSelectedPlatform(null)
    setProfileUrl("")
    setValidationError("")
    onClose()
  }


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-lg"
        style={{
          width: "351px",
          height: selectedPlatform ? (validationError ? "250px" : "220px") : "320px",
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

            <div className="absolute" style={{ width: "195px", height: "189px", left: "78px", top: "90px" }}>
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
                  {editingPlatform ? 'Update your handle' : 'Enter your handle'}
                </p>
              </div>

              {/* Frame 702 - Icon and input row */}
              <div
                className="flex flex-col w-full"
                style={{
                  padding: "0px",
                  gap: "4px",
                  width: "320px",
                }}
              >
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
                      border: `1px solid ${validationError ? "#DC2627" : "#848282"}`,
                    borderRadius: "6px",
                  }}
                >
                  <input
                    type="text"
                      placeholder={selectedPlatform.placeholder}
                    value={profileUrl}
                      onChange={handleInputChange}
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
                
                {/* Validation error message */}
                {validationError && (
                  <div
                    style={{
                      fontFamily: "Poppins",
                      fontWeight: 400,
                      fontSize: "10px",
                      lineHeight: "14px",
                      color: "#DC2627",
                      paddingLeft: "52px",
                    }}
                  >
                    {validationError}
                  </div>
                )}
              </div>

              {/* Component 49 - Connect button */}
              <button
                onClick={handleConnect}
                disabled={!profileUrl.trim() || !!validationError}
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
