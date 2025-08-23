'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ToolType, Rectangle, Point, ViewTransform } from '@/types/tools';

interface CanvasProps {
  width: number;
  height: number;
  brushSize: number;
  brushHardness: number;
  brushColor: string;
  activeTool: ToolType;
  selection: Rectangle | null;
  onSelectionChange: (selection: Rectangle | null) => void;
  viewTransform: ViewTransform;
  onViewTransformChange: (transform: ViewTransform) => void;
}

export default function Canvas({ 
  width, 
  height, 
  brushSize,
  brushHardness,
  brushColor, 
  activeTool, 
  selection,
  onSelectionChange,
  viewTransform = { zoom: 1, panX: 0, panY: 0 },
  onViewTransformChange
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [lastPos, setLastPos] = useState<Point>({ x: 0, y: 0 });
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });
  const panStartTransformRef = useRef<ViewTransform>({ zoom: 1, panX: 0, panY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  useEffect(() => {
    drawSelectionOverlay();
  }, [selection]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Transform screen coordinates to canvas coordinates
    const canvasX = (rawX - viewTransform.panX) / viewTransform.zoom;
    const canvasY = (rawY - viewTransform.panY) / viewTransform.zoom;
    
    return {
      x: canvasX,
      y: canvasY
    };
  };

  const getScreenPos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const isPointInSelection = (point: Point): boolean => {
    if (!selection) return true;
    
    return point.x >= selection.x && 
           point.x <= selection.x + selection.width &&
           point.y >= selection.y && 
           point.y <= selection.y + selection.height;
  };

  const drawSelectionOverlay = () => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

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

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, viewTransform.zoom * zoomFactor));

    // Zoom towards mouse position
    const zoomRatio = newZoom / viewTransform.zoom;
    const newPanX = mouseX - (mouseX - viewTransform.panX) * zoomRatio;
    const newPanY = mouseY - (mouseY - viewTransform.panY) * zoomRatio;

    onViewTransformChange({
      zoom: newZoom,
      panX: newPanX,
      panY: newPanY
    });
  }, [viewTransform, onViewTransformChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const screenPos = getScreenPos(e);
    setIsMouseDown(true);

    // Middle mouse button or pan tool
    if (e.button === 1 || activeTool === 'pan') {
      setIsPanning(true);
      panStartRef.current = screenPos;
      panStartTransformRef.current = { ...viewTransform };
      return;
    }

    if (activeTool === 'brush') {
      if (isPointInSelection(pos)) {
        setLastPos(pos);
      }
    } else if (activeTool === 'selection') {
      setSelectionStart(pos);
      onSelectionChange(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const currentPos = getMousePos(e);
    const screenPos = getScreenPos(e);

    if (!isMouseDown) return;

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

    if (activeTool === 'brush') {
      if (!isPointInSelection(currentPos) || !isPointInSelection(lastPos)) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize / viewTransform.zoom; // Adjust brush size for zoom
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Apply brush hardness by adjusting alpha
      const hardnessAlpha = brushHardness / 100;
      ctx.globalAlpha = hardnessAlpha;

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
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
      }
      
      // Reset alpha for other drawing operations
      ctx.globalAlpha = 1;

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
  };

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    
    switch (activeTool) {
      case 'brush':
        return 'crosshair';
      case 'selection':
        return 'crosshair';
      case 'pan':
        return 'grab';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4" style={{ backgroundColor: 'var(--surface-dark)' }}>
      <div 
        ref={containerRef}
        className="relative border-2 shadow-lg overflow-hidden" 
        style={{ 
          borderColor: 'var(--border)',
          width: '100%',
          height: '100%',
          maxWidth: '90vw',
          maxHeight: '80vh'
        }}
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
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            className="absolute top-0 left-0"
            style={{ 
              display: 'block',
              cursor: getCursor()
            }}
          />
        </div>
      </div>
    </div>
  );
}