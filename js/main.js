/**
 * Main JavaScript file for PlayerZero site
 */
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize modals
  initModals();
  
  // Log that site is loaded (helpful for debugging)
  console.log('PlayerZero site loaded');
});

/**
 * Initialize modals throughout the site
 */
function initModals() {
  // Prize info modal
  const prizeBtn = document.getElementById('prizeInfoBtn');
  const prizeModal = document.getElementById('prizeInfoModal');
  const closeModal = document.getElementById('closeModal');
  
  if (prizeBtn && prizeModal && closeModal) {
    // Open modal when button is clicked
    prizeBtn.addEventListener('click', () => {
      prizeModal.style.display = 'flex';
    });
    
    // Close modal when X is clicked
    closeModal.addEventListener('click', () => {
      prizeModal.style.display = 'none';
    });
    
    // Close modal when clicking outside content
    prizeModal.addEventListener('click', (e) => {
      if (e.target === prizeModal) {
        prizeModal.style.display = 'none';
      }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && prizeModal.style.display === 'flex') {
        prizeModal.style.display = 'none';
      }
    });
  }
  
  // Verification modal for leaderboard (if it exists)
  const verificationModal = document.getElementById('verification-modal');
  const verifyBtns = document.querySelectorAll('.verify-btn');
  const closeVerifyBtn = verificationModal ? verificationModal.querySelector('.close-btn') : null;
  
  if (verificationModal && verifyBtns.length && closeVerifyBtn) {
    // Open modal when verify button is clicked
    verifyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const playerName = btn.getAttribute('data-player');
        openVerificationModal(playerName);
      });
    });
    
    // Close modal when X is clicked
    closeVerifyBtn.addEventListener('click', () => {
      verificationModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === verificationModal) {
        verificationModal.style.display = 'none';
      }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && verificationModal.style.display === 'block') {
        verificationModal.style.display = 'none';
      }
    });
  }
}

/**
 * Open verification modal with player data
 * @param {string} playerName - Name of player to verify
 */
function openVerificationModal(playerName) {
  const modal = document.getElementById('verification-modal');
  if (!modal) return;
  
  // Update the modal with player name
  const nameElement = document.getElementById('modal-player-name');
  if (nameElement) {
    nameElement.textContent = playerName;
  }
  
  // Display the modal
  modal.style.display = 'block';
  
  // In a real implementation, this would fetch verification data
  // fetchVerificationData(playerName).then(data => updateVerificationModal(data));
}

/**
 * Helper function to format numbers with commas
 * @param {number} num - Number to format
 * @return {string} Formatted number string
 */
function formatNumber(num) {
  return num.toLocaleString();
}

/**
 * Helper function to validate date formats
 * @param {string} dateStr - Date string to validate
 * @return {boolean} Whether date is valid
 */
function isValidDate(dateStr) {
  // Check MM/DD/YYYY format
  const mmddRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  
  // Check YYYY-MM-DD format
  const yyyymmRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
  
  return mmddRegex.test(dateStr) || yyyymmRegex.test(dateStr);
}

/**
 * Format date to Month Day, Year format
 * @param {string|Date} date - Date to format
 * @return {string} Formatted date string
 */
function formatDate(date) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
}

/**
 * Show notification message to user
 * @param {string} message - Message to display
 * @param {string} type - Type of message (success, error, warning)
 * @param {number} duration - How long to show the notification in ms
 */
function showNotification(message, type = 'info', duration = 3000) {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'notification';
    document.body.appendChild(notification);
    
    // Add CSS if not already in stylesheet
    if (!document.getElementById('notification-style')) {
      const style = document.createElement('style');
      style.id = 'notification-style';
      style.textContent = `
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 15px 20px;
          border-radius: 5px;
          color: white;
          font-weight: bold;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s;
          max-width: 300px;
        }
        .notification.visible {
          opacity: 1;
        }
        .notification.info {
          background-color: #2196F3;
        }
        .notification.success {
          background-color: #4CAF50;
        }
        .notification.warning {
          background-color: #FF9800;
        }
        .notification.error {
          background-color: #F44336;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Set content and type
  notification.textContent = message;
  notification.className = 'notification ' + type;
  
  // Make visible
  setTimeout(() => {
    notification.classList.add('visible');
  }, 10);
  
  // Hide after duration
  setTimeout(() => {
    notification.classList.remove('visible');
  }, duration);
}

/**
 * Calculate PlayerZero score based on stats
 * @param {Object} stats - Player statistics
 * @return {number} Calculated PlayerZero score
 */
function calculatePlayerZeroScore(stats) {
  // Simple formula for PlayerZero score calculation
  return Math.round(
    (stats.distanceWalked / 10) +
    (stats.pokemonCaught / 100) +
    (stats.pokestopsVisited / 100) +
    (stats.totalXP / 100000) +
    (stats.level * 10)
  );
}

/**
 * Switch between tabs in a tabbed interface
 * @param {string} tabId - ID of the tab to switch to
 * @param {string} groupClass - Class of the tab group
 */
function switchTab(tabId, groupClass) {
  // Hide all tab contents
  const contents = document.querySelectorAll('.' + groupClass + '-content');
  contents.forEach(content => {
    content.classList.remove('active');
  });
  
  // Deactivate all tabs
  const tabs = document.querySelectorAll('.' + groupClass + '-btn');
  tabs.forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Activate selected tab and content
  document.getElementById(tabId + '-tab').classList.add('active');
  document.querySelector('[data-tab="' + tabId + '"]').classList.add('active');
}
