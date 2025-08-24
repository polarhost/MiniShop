export const drawTransparencyPattern = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  checkerSize = 10
) => {
  // Clear the canvas
  ctx.clearRect(0, 0, width, height);
  
  // Set checker colors (light gray and white)
  const lightColor = '#ffffff';
  const darkColor = '#e5e5e5';
  
  // Draw checkered pattern
  for (let x = 0; x < width; x += checkerSize) {
    for (let y = 0; y < height; y += checkerSize) {
      // Determine checker color based on position
      const isEvenRow = Math.floor(y / checkerSize) % 2 === 0;
      const isEvenCol = Math.floor(x / checkerSize) % 2 === 0;
      const useLight = isEvenRow ? isEvenCol : !isEvenCol;
      
      ctx.fillStyle = useLight ? lightColor : darkColor;
      ctx.fillRect(x, y, checkerSize, checkerSize);
    }
  }
};

export const createTransparencyPatternCanvas = (
  width: number,
  height: number,
  checkerSize = 10
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    drawTransparencyPattern(ctx, width, height, checkerSize);
  }
  
  return canvas;
};