export const formatTimestamp = (dateString) => {
  try {
    let date = new Date(parseInt(dateString));
    if (isNaN(date.getTime())) {
      // If parsing as timestamp fails, try direct Date parsing
      const directDate = new Date(dateString);
      if (isNaN(directDate.getTime())) {
        return 'Just now'; // Fallback for invalid dates
      }
      date = directDate;
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Just now';
  }
}; 