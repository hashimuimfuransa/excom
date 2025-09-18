/**
 * Image Helper Utilities
 * Provides consistent image handling across the application
 */

export const getPlaceholderImage = (type?: string, id?: string, size?: 'small' | 'medium' | 'large' | 'hero') => {
  // Use high-quality, relevant stock images from Unsplash with consistent dimensions
  const dimensions = {
    small: 'w=200&h=200',
    medium: 'w=600&h=400', 
    large: 'w=800&h=600',
    hero: 'w=1600&h=700'
  };
  
  const dim = dimensions[size || 'medium'];
  
  const placeholders = {
    'hotel': `https://images.unsplash.com/photo-1566073771259-6a8506099945?${dim}&fit=crop&crop=center`,
    'restaurant': `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?${dim}&fit=crop&crop=center`,
    'real-estate': `https://images.unsplash.com/photo-1570129477492-45c003edd2be?${dim}&fit=crop&crop=center`,
    'service': `https://images.unsplash.com/photo-1497366216548-37526070297c?${dim}&fit=crop&crop=center`,
    'product': `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?${dim}&fit=crop&crop=center`,
    'booking': `https://images.unsplash.com/photo-1566073771259-6a8506099945?${dim}&fit=crop&crop=center`,
    'collection': `https://images.unsplash.com/photo-1441986300917-64674bd600d8?${dim}&fit=crop&crop=center`,
    'default': `https://images.unsplash.com/photo-1441986300917-64674bd600d8?${dim}&fit=crop&crop=center`
  };
  return placeholders[type as keyof typeof placeholders] || placeholders.default;
};

/**
 * Get the main image for a product/collection/item
 * @param images - Array of image URLs
 * @param type - Type of item (hotel, restaurant, product, etc.)
 * @param id - Item ID for fallback consistency
 * @param size - Image size (small, medium, large, hero)
 * @returns The main image URL or a relevant placeholder
 */
export const getMainImage = (images?: string[], type?: string, id?: string, size?: 'small' | 'medium' | 'large' | 'hero'): string => {
  // Check if we have real uploaded images
  const hasRealImages = images && images.length > 0 && images[0] && images[0].trim() !== '';
  
  if (hasRealImages) {
    return images[0];
  }
  
  // Return relevant placeholder based on type and size
  return getPlaceholderImage(type, id, size);
};

/**
 * Check if an item has real uploaded images
 * @param images - Array of image URLs
 * @returns Boolean indicating if real images exist
 */
export const hasRealImages = (images?: string[]): boolean => {
  return !!(images && images.length > 0 && images[0] && images[0].trim() !== '');
};

/**
 * Get image with specific dimensions
 * @param imageUrl - Original image URL
 * @param width - Desired width
 * @param height - Desired height
 * @returns Image URL with dimensions (works with Unsplash URLs)
 */
export const getImageWithDimensions = (imageUrl: string, width: number, height: number): string => {
  if (imageUrl.includes('unsplash.com')) {
    // For Unsplash URLs, update the dimensions
    return imageUrl.replace(/w=\d+/, `w=${width}`).replace(/h=\d+/, `h=${height}`);
  }
  return imageUrl;
};

/**
 * Get cart/booking item image
 * @param item - Cart or booking item
 * @returns Image URL for cart display
 */
export const getCartItemImage = (item: { image?: string; type?: string; id: string }): string => {
  if (item.image && item.image.trim() !== '') {
    return getImageWithDimensions(item.image, 200, 200);
  }
  return getImageWithDimensions(getPlaceholderImage(item.type || 'product', item.id), 200, 200);
};