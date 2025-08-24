export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp';
  quality?: number; // 0-1 for JPEG/WebP
  includeTransparency?: boolean;
}

/**
 * Export canvas with proper transparency handling
 * PNG format preserves alpha channel, JPEG fills transparent areas with white
 */
export const exportCanvas = (
  canvas: HTMLCanvasElement,
  options: ExportOptions = { format: 'png' }
): string => {
  const { format, quality = 0.92, includeTransparency = true } = options;
  
  if (format === 'png' && includeTransparency) {
    // PNG supports transparency - export as-is
    return canvas.toDataURL('image/png');
  } else if (format === 'jpeg' || !includeTransparency) {
    // JPEG doesn't support transparency, or user wants no transparency
    // Create a new canvas with white background
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return '';
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
    // Draw the original canvas on top
    ctx.drawImage(canvas, 0, 0);
    
    if (format === 'jpeg') {
      return exportCanvas.toDataURL('image/jpeg', quality);
    } else if (format === 'webp') {
      return exportCanvas.toDataURL('image/webp', quality);
    } else {
      return exportCanvas.toDataURL('image/png');
    }
  } else if (format === 'webp') {
    // WebP supports transparency
    return canvas.toDataURL('image/webp', quality);
  }
  
  // Default to PNG
  return canvas.toDataURL('image/png');
};

/**
 * Check if a canvas has transparent areas
 */
export const hasTransparentAreas = (canvas: HTMLCanvasElement): boolean => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Check alpha channel (every 4th value)
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      return true; // Found transparent or semi-transparent pixel
    }
  }
  
  return false;
};