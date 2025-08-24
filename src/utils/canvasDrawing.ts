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
  viewTransform: ViewTransform,
  isBackgroundLayer = false
) => {
  // Apply opacity and hardness
  const opacityValue = brushOpacity / 100;
  const hardnessValue = brushHardness / 100;

  if (activeTool === 'eraser') {
    // For all layers (including background), use destination-out to make areas transparent
    // This allows the transparency pattern to show through
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = opacityValue * hardnessValue;
    
    // For soft eraser (low hardness), create a gradient effect
    if (brushHardness < 100) {
      const gradient = ctx.createRadialGradient(
        currentPos.x, currentPos.y, 0,
        currentPos.x, currentPos.y, (brushSize / viewTransform.zoom) / 2
      );
      
      gradient.addColorStop(0, `rgba(0,0,0,${hardnessValue})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(currentPos.x, currentPos.y, (brushSize / viewTransform.zoom) / 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    } else {
      // Hard eraser - normal line drawing to cut out
      ctx.lineWidth = brushSize / viewTransform.zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,1)'; // Color doesn't matter with destination-out
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