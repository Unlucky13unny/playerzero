import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, clearNotification } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = (id: string) => {
    clearNotification(id);
  };

  const handleClearAll = () => {
    notifications.forEach(notification => {
      clearNotification(notification.id);
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <div className="notification-container" ref={dropdownRef}>
      <button 
        className="nav-button icon-only"
        onClick={toggleNotifications}
        title="Notifications"
        style={{
          border: 'none',
          background: 'transparent'
        }}
      >
        {unreadCount > 0 ? (
          // Bell icon with notification (red dot)
          <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.8569 11V13.4211V11Z" fill="#616161" fillOpacity="0.11"/>
            <path d="M21.8569 11V13.4211" stroke="#616161" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21.8571 13.421C17.8502 13.421 14.5939 16.6773 14.5939 20.6842V27.9473C13.3834 27.9473 12.1729 29.1579 12.1729 30.3684H21.8571M21.8571 13.421C25.8639 13.421 29.1202 16.6773 29.1202 20.6842V27.9473C30.3307 27.9473 31.5413 29.1579 31.5413 30.3684H21.8571" fill="#616161" fillOpacity="0.11"/>
            <path d="M21.8571 13.421C17.8502 13.421 14.5939 16.6773 14.5939 20.6842V27.9473C13.3834 27.9473 12.1729 29.1579 12.1729 30.3684H21.8571H31.5413C31.5413 29.1579 30.3307 27.9473 29.1202 27.9473V20.6842C29.1202 16.6773 25.8639 13.421 21.8571 13.421Z" stroke="#616161" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.436 31.5789C19.436 32.9105 20.5255 34 21.8571 34C23.1887 34 24.2781 32.9105 24.2781 31.5789" fill="#616161" fillOpacity="0.11"/>
            <path d="M19.436 31.5789C19.436 32.9105 20.5255 34 21.8571 34C23.1887 34 24.2781 32.9105 24.2781 31.5789" stroke="#616161" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="27" cy="15" r="3.5" fill="#DC2627" stroke="white"/>
          </svg>
        ) : (
          // Bell icon without notification
          <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.8569 11V13.4211" stroke="#DC2627" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21.8571 13.4211C17.8502 13.4211 14.5939 16.6774 14.5939 20.6842V27.9474C13.3834 27.9474 12.1729 29.1579 12.1729 30.3684H21.8571M21.8571 13.4211C25.8639 13.4211 29.1202 16.6774 29.1202 20.6842V27.9474C30.3307 27.9474 31.5413 29.1579 31.5413 30.3684H21.8571" stroke="#DC2627" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.436 31.5789C19.436 32.9105 20.5255 34 21.8571 34C23.1887 34 24.2781 32.9105 24.2781 31.5789" stroke="#DC2627" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="mark-all-read"
                onClick={() => handleClearAll()}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                No notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="notification-content hover:bg-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200">
                    <h4 className="font-bold text-left mb-1" style={{ fontSize: '12px', color: '#000000', fontFamily: 'Poppins' }}>Reminder</h4>
                    <p className="text-left" style={{ fontSize: '11px', fontFamily: 'Poppins' }}>{notification.message}</p>
                   { /*<span className="notification-time text-left" style={{ fontSize: '10px' }}>
                      {formatNotificationTime(notification.created_at)}
                    </span>  */}
                  </div>
                  <button 
                    className="envelope-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!notification.is_read) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    {notification.is_read ? (
                      <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.3075 0.169434C9.05462 -0.433016 10.2125 -0.390058 10.9012 0.29541L18.2362 7.38721H18.2352C18.3094 7.44764 18.3778 7.51559 18.4393 7.59229L18.8817 8.03467H18.6776C18.7022 8.11139 18.7224 8.19017 18.7333 8.27197L18.7362 8.28955C18.746 8.34469 18.7511 8.40592 18.7479 8.47119H18.7489V16.8784C18.7487 17.6348 18.1303 18.2534 17.3739 18.2534H1.6239C0.867488 18.2534 0.249109 17.6348 0.248901 16.8784V8.44873C0.248972 8.18379 0.364313 7.93749 0.4823 7.75342C0.602666 7.56566 0.744393 7.41377 0.835815 7.32861L8.16394 0.29834L8.3075 0.169434ZM9.44617 10.9214C9.34741 10.9214 9.2522 10.953 9.16882 11.019L6.71277 13.2808C6.70824 13.2868 6.70434 13.2952 6.69812 13.3022C6.6542 13.352 6.60608 13.3898 6.5614 13.4214L3.07996 16.6284H15.9686L9.71863 11.0054C9.65599 10.9591 9.55219 10.9214 9.44617 10.9214ZM1.8739 15.5298L4.86804 12.771L1.8739 10.1284V15.5298ZM14.1893 12.8423L17.1239 15.4819V10.2388L14.1893 12.8423ZM9.53308 1.35596C9.45024 1.35607 9.37247 1.38813 9.31238 1.44775L9.30847 1.45166L2.49695 7.96533L2.42468 8.03467H2.40125L2.19031 8.2417L6.07019 11.6646L8.11121 9.78662L8.11707 9.78076L8.1239 9.77588C8.86827 9.17543 9.86346 9.15942 10.6044 9.64502L10.7499 9.74951L10.7557 9.75439L10.7626 9.76025L12.9735 11.7495L16.869 8.29248L16.0887 7.49951L15.8427 7.24951L9.75964 1.45166L9.75574 1.44775C9.69559 1.38794 9.6169 1.35596 9.53308 1.35596Z" fill="#353535" stroke="#353535" stroke-width="0.5"/>
                      </svg>
                    ) : (
                      <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.249 3.17822L16.4961 3.19092C17.0669 3.24713 17.6042 3.49454 18.0146 3.89697C18.484 4.35735 18.7493 4.98304 18.75 5.63623V14.9351C18.7492 15.5881 18.4839 16.213 18.0146 16.6733C17.6042 17.0759 17.0671 17.3242 16.4961 17.3804L16.249 17.3921H2.75098C2.08953 17.3914 1.45453 17.1335 0.985352 16.6733C0.516079 16.213 0.250812 15.5881 0.25 14.9351V5.63623L0.262695 5.39307C0.320218 4.82935 0.574569 4.29991 0.985352 3.89697C1.45451 3.43693 2.08962 3.17893 2.75098 3.17822H16.249ZM9.95117 12.4917C9.82716 12.6027 9.66616 12.6636 9.5 12.6636C9.33384 12.6636 9.17284 12.6027 9.04883 12.4917L7.58496 11.1812L2.25293 15.9536C2.40715 16.0258 2.57703 16.0651 2.75098 16.0649H16.249L16.3516 16.0601C16.4893 16.0481 16.6225 16.0114 16.7461 15.9536L11.4141 11.1812L9.95117 12.4917ZM1.59375 14.7524L6.58398 10.2847L1.59375 5.81689V14.7524ZM12.415 10.2847L17.4062 14.7524V5.81689L12.415 10.2847ZM2.64844 4.51025C2.5103 4.52222 2.37582 4.55767 2.25195 4.61572L9.5 11.103L16.7471 4.61572C16.6234 4.55788 16.4894 4.52219 16.3516 4.51025L16.249 4.50537H2.75098L2.64844 4.51025Z" fill="#F16060" stroke="#F16060" stroke-width="0.5"/>
                        <circle cx="15.0714" cy="3.42836" r="2.07143" fill="#F16060" stroke="white"/>
                      </svg>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 