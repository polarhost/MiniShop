'use client';

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ToolType, Rectangle, Point, ViewTransform } from '@/types/tools';
import { paintAtPosition } from '@/utils/canvasDrawing';
import { drawCursorPreview } from '@/utils/canvasOverlay';
import { getMousePos, getScreenPos, isPointInSelection } from '@/utils/canvasCoordinates';
import { useCanvasInteractions } from '@/hooks/useCanvasInteractions';

interface CanvasProps {
  width: number;
  height: number;
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushHardness: number;
  brushOpacity: number;
  brushColor: string;
  activeTool: ToolType;
  selection: Rectangle | null;
  onSelectionChange: (selection: Rectangle | null) => void;
  viewTransform: ViewTransform;
  onViewTransformChange: (transform: ViewTransform) => void;
}

export interface CanvasRef {
  deleteSelection: () => void;
}

const Canvas = forwardRef<CanvasRef, CanvasProps>(function Canvas({ 
  width, 
  height, 
  brushSize,
  setBrushSize,
  brushHardness,
  brushOpacity,
  brushColor, 
  activeTool, 
  selection,
  onSelectionChange,
  viewTransform = { zoom: 1, panX: 0, panY: 0 },
  onViewTransformChange
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [lastPos, setLastPos] = useState<Point>({ x: 0, y: 0 });
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const [isResizingBrush, setIsResizingBrush] = useState(false);
  const [tempBrushSize, setTempBrushSize] = useState(brushSize);
  const [fixedCursorPos, setFixedCursorPos] = useState<Point | null>(null);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });
  const panStartTransformRef = useRef<ViewTransform>({ zoom: 1, panX: 0, panY: 0 });
  const brushResizeStartRef = useRef<Point>({ x: 0, y: 0 });
  const originalBrushSizeRef = useRef<number>(brushSize);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);


  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;
    
    drawCursorPreview(
      ctx,
      width,
      height,
      cursorPos,
      fixedCursorPos,
      brushSize,
      tempBrushSize,
      activeTool,
      viewTransform,
      isPanning,
      isResizingBrush,
      selection,
      originalBrushSizeRef.current
    );
  }, [cursorPos, fixedCursorPos, brushSize, tempBrushSize, activeTool, viewTransform, isPanning, isResizingBrush, selection, width, height]);

  // Clear cursor position when switching away from brush/eraser tools
  useEffect(() => {
    if (activeTool !== 'brush' && activeTool !== 'eraser') {
      setCursorPos(null);
    }
  }, [activeTool]);

  const { handleWheel, getCursor } = useCanvasInteractions(
    containerRef,
    viewTransform,
    onViewTransformChange
  );


  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e, containerRef, viewTransform);
    const screenPos = getScreenPos(e, containerRef);
    
    // button 2 == right click.
    // Check for Alt + right-click for brush/eraser size adjustment
    if (e.altKey && (activeTool === 'brush' || activeTool === 'eraser') && e.button === 2) {
      setIsMouseDown(true);
      setIsResizingBrush(true);
      brushResizeStartRef.current = screenPos;
      originalBrushSizeRef.current = brushSize;
      setTempBrushSize(brushSize);
      setFixedCursorPos(pos); // Fix cursor at initial position
      return;
    }
    // button 0 == right click
    if (e.button === 0  ) {
      setIsMouseDown(true);
      
      if (activeTool === 'pan') {
        setIsPanning(true);
        panStartRef.current = screenPos;
        panStartTransformRef.current = { ...viewTransform };
        return;
      }

      if (activeTool === 'brush' || activeTool === 'eraser') {
        if (isPointInSelection(pos, selection)) {
          setLastPos(pos);
          
          // Paint immediately on click (for single clicks)
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (ctx) {
            paintAtPosition(ctx, pos, pos, activeTool, brushSize, brushHardness, brushOpacity, brushColor, viewTransform);
          }
        }
      } else if (activeTool === 'selection') {
        setSelectionStart(pos);
        onSelectionChange(null);
      }
    }

    // Middle mouse button (button 1) always pans regardless of tool
    if (e.button === 1) {
      setIsMouseDown(true);
      setIsPanning(true);
      panStartRef.current = screenPos;
      panStartTransformRef.current = { ...viewTransform };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const currentPos = getMousePos(e, containerRef, viewTransform);
    const screenPos = getScreenPos(e, containerRef);

    // Update cursor position for preview (always for brush/eraser, regardless of mouse down state)
    if (activeTool === 'brush' || activeTool === 'eraser') {
      setCursorPos(currentPos);
    }

    if (!isMouseDown) return;

    // Handle brush resizing
    if (isResizingBrush) {
      const deltaX = screenPos.x - brushResizeStartRef.current.x;
      const sensitivity = 0.5; // Adjust this to make resizing more/less sensitive
      // Note: Max brush size
      const newSize = Math.max(1, Math.min(500, originalBrushSizeRef.current + deltaX * sensitivity));
      setTempBrushSize(newSize);
      
      // Update the actual brush size in real-time for slider feedback
      setBrushSize(newSize);
      return;
    }

    // Handle panning
    if (isPanning) {
      const deltaX = screenPos.x - panStartRef.current.x;
      const deltaY = screenPos.y - panStartRef.current.y;
      
      onViewTransformChange({
        zoom: panStartTransformRef.current.zoom,
        panX: panStartTransformRef.current.panX + deltaX,
        panY: panStartTransformRef.current.panY + deltaY
      });
      
      return;
    }

    if (activeTool === 'brush' || activeTool === 'eraser') {
      if (!isPointInSelection(currentPos, selection) || !isPointInSelection(lastPos, selection)) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      paintAtPosition(ctx, currentPos, lastPos, activeTool, brushSize, brushHardness, brushOpacity, brushColor, viewTransform);
      setLastPos(currentPos);
    } else if (activeTool === 'selection' && selectionStart) {
      const newSelection: Rectangle = {
        x: Math.min(selectionStart.x, currentPos.x),
        y: Math.min(selectionStart.y, currentPos.y),
        width: Math.abs(currentPos.x - selectionStart.x),
        height: Math.abs(currentPos.y - selectionStart.y)
      };
      onSelectionChange(newSelection);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setSelectionStart(null);
    setIsPanning(false);
    
    // End brush resize
    if (isResizingBrush) {
      setIsResizingBrush(false);
      setFixedCursorPos(null); // Clear fixed position
      // No need to set brush size here since it's updated in real-time
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const currentPos = getMousePos(e, containerRef, viewTransform);
    if (activeTool === 'brush' || activeTool === 'eraser') {
      setCursorPos(currentPos);
    }
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
  };


  const deleteSelectionArea = useCallback(() => {
    if (!selection) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Save the current context state
    ctx.save();
    
    // Reset any transformations and composite operations
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    
    // Fill the selected area with background color (white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
    
    // Restore the context state
    ctx.restore();
  }, [selection]);

  // Expose deleteSelection function via ref
  useImperativeHandle(ref, () => ({
    deleteSelection: deleteSelectionArea
  }), [deleteSelectionArea]);


  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
    >
      <div
        className="absolute"
        style={{
          transform: `translate(${viewTransform.panX}px, ${viewTransform.panY}px) scale(${viewTransform.zoom})`,
          transformOrigin: '0 0',
          width: width,
          height: height
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ 
            display: 'block'
          }}
        />
        <canvas
          ref={overlayCanvasRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onContextMenu={(e) => e.preventDefault()}
          className="absolute top-0 left-0"
          style={{ 
            display: 'block',
            cursor: getCursor(isPanning, isResizingBrush, activeTool)
          }}
        />
      </div>
    </div>
  );
});

export default Canvas;