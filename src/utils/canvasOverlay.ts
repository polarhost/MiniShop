import { Point, Rectangle, ToolType, ViewTransform } from '@/types/tools';

export const drawSelectionOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  selection: Rectangle | null,
  viewTransform: ViewTransform
) => {
  ctx.clearRect(0, 0, width, height);

  if (selection) {
    ctx.strokeStyle = '#007acc';
    ctx.lineWidth = 1 / viewTransform.zoom; // Adjust line width for zoom
    ctx.setLineDash([5 / viewTransform.zoom, 5 / viewTransform.zoom]); // Adjust dash for zoom
    ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);

    ctx.fillStyle = 'rgba(0, 122, 204, 0.1)';
    ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
  }
};

export const drawCursorPreview = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cursorPos: Point | null,
  fixedCursorPos: Point | null,
  brushSize: number,
  tempBrushSize: number,
  activeTool: ToolType,
  viewTransform: ViewTransform,
  isPanning: boolean,
  isResizingBrush: boolean,
  selection: Rectangle | null,
  originalBrushSize?: number
) => {
  // First draw selection overlay
  drawSelectionOverlay(ctx, width, height, selection, viewTransform);

  // Only draw cursor preview for brush/eraser tools, not while panning, and when cursor position is available
  if (isPanning) return;
  if (activeTool !== 'brush' && activeTool !== 'eraser') return;
  if (!cursorPos) return;

  // Draw normal cursor preview circle (always follows mouse)
  // Show original brush size at mouse position during resize, current brush size otherwise
  const currentBrushSizeAtCursor = isResizingBrush ? (originalBrushSize || brushSize) : brushSize;
  const radius = (currentBrushSizeAtCursor / viewTransform.zoom) / 2;
  const alpha = isResizingBrush ? 0.4 : 0.7; // More transparent during resize
  
  ctx.setLineDash([]); // Reset line dash
  
  // Draw white outline first (for visibility on dark backgrounds)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3 / viewTransform.zoom; // Thicker white outline
  ctx.globalAlpha = alpha * 0.8; // Slightly more transparent for outline
  ctx.beginPath();
  ctx.arc(cursorPos.x, cursorPos.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw colored circle on top
  ctx.strokeStyle = activeTool === 'brush' ? '#000000' : '#ff0000';
  ctx.lineWidth = 1 / viewTransform.zoom;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(cursorPos.x, cursorPos.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.globalAlpha = 1;

  // Draw fixed dummy circle indicator during brush resizing
  if (isResizingBrush && fixedCursorPos) {
    const dummyRadius = (tempBrushSize / viewTransform.zoom) / 2;
    
    ctx.setLineDash([]); // Reset line dash
    
    // Draw white outline first (for visibility on dark backgrounds)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4 / viewTransform.zoom; // Slightly thicker outline for the resize indicator
    ctx.globalAlpha = 0.8; // Slightly transparent outline
    ctx.beginPath();
    ctx.arc(fixedCursorPos.x, fixedCursorPos.y, dummyRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw colored circle on top
    ctx.strokeStyle = activeTool === 'brush' ? '#000000' : '#ff0000';
    ctx.lineWidth = 2 / viewTransform.zoom; // Slightly thicker for the resize indicator
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(fixedCursorPos.x, fixedCursorPos.y, dummyRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.globalAlpha = 1;
  }
};