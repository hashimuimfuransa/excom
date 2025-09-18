export const navigateWithLoading = (href: string, delay: number = 300) => {
  // Dispatch loading start event
  window.dispatchEvent(new CustomEvent('navigationStart'));
  
  setTimeout(() => {
    window.location.href = href;
    // Loading will be cleared when page loads
  }, delay);
};

export const handleNavigation = (router: any, href: string, delay: number = 300) => {
  // Dispatch loading start event
  window.dispatchEvent(new CustomEvent('navigationStart'));
  
  setTimeout(() => {
    router.push(href);
    // Clear loading after navigation
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('navigationComplete'));
    }, 100);
  }, delay);
};