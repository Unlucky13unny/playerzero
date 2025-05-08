/**
 * Main JavaScript file for PlayerZero site
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Modal functionality
  initModals();
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
