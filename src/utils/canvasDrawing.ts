import { Point, ToolType, ViewTransform } from '@/types/tools';

export const paintAtPosition = (
  ctx: CanvasRenderingContext2D,
  currentPos: Point,
  lastPos: Point,
  activeTool: ToolType,
  brushSize: number,
  brushHardness: number,
  brushOpacity: number,
  brushColor: string,
  viewTransform: ViewTransform
) => {
  // Apply opacity and hardness
  const opacityValue = brushOpacity / 100;
  const hardnessValue = brushHardness / 100;

  if (activeTool === 'eraser') {
    // For eraser, draw with the background color (white) to "erase"
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#ffffff'; // Draw with white background color to erase
    ctx.globalAlpha = opacityValue * hardnessValue;
    
    // For soft eraser (low hardness), create a gradient effect
    if (brushHardness < 100) {
      const gradient = ctx.createRadialGradient(
        currentPos.x, currentPos.y, 0,
        currentPos.x, currentPos.y, (brushSize / viewTransform.zoom) / 2
      );
      
      gradient.addColorStop(0, `rgba(255,255,255,${hardnessValue})`);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(currentPos.x, currentPos.y, (brushSize / viewTransform.zoom) / 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    } else {
      // Hard eraser - normal line drawing with white
      ctx.lineWidth = brushSize / viewTransform.zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.stroke();
    }
  } else {
    // Regular brush
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = brushColor;
    ctx.globalAlpha = opacityValue * hardnessValue;
    
    // For soft brushes (low hardness), create a gradient effect
    if (brushHardness < 100) {
      const gradient = ctx.createRadialGradient(
        currentPos.x, currentPos.y, 0,
        currentPos.x, currentPos.y, (brushSize / viewTransform.zoom) / 2
      );
      
      const color = ctx.strokeStyle;
      gradient.addColorStop(0, color as string);
      gradient.addColorStop(1, 'transparent');
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(currentPos.x, currentPos.y, (brushSize / viewTransform.zoom) / 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    } else {
      // Hard brush - normal line drawing
      ctx.lineWidth = brushSize / viewTransform.zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.stroke();
    }
  }
  
  // Reset blend mode and alpha for other drawing operations
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
};