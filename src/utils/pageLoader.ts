
// Handle page load to prevent flash of unstyled content
export function initPageLoader() {
  document.documentElement.classList.add('js');
  
  // Set a small timeout to ensure everything is loaded
  setTimeout(function() {
    document.documentElement.classList.add('page-loaded');
  }, 100);
}
