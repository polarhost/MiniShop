'use client';

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ToolType, Rectangle, Point, ViewTransform } from '@/types/tools';
import { paintAtPosition } from '@/utils/canvasDrawing';
import { drawCursorPreview } from '@/utils/canvasOverlay';
import { getMousePos, getScreenPos, isPointInSelection } from '@/utils/canvasCoordinates';
import { useCanvasInteractions } from '@/hooks/useCanvasInteractions';
import { Layer } from './LayersPanel';
import { createTransparencyPatternCanvas } from '@/utils/transparencyPattern';
import { CanvasHistoryManager, captureAllLayersState, restoreAllLayersState } from '@/utils/historyManager';

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
  layers: Layer[];
  activeLayerId: string;
}

export interface CanvasRef {
  deleteSelection: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
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
  onViewTransformChange,
  layers,
  activeLayerId
}, ref) {
  const layerCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const transparencyPatternRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerOverlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [lastPos, setLastPos] = useState<Point>({ x: 0, y: 0 });
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const [screenCursorPos, setScreenCursorPos] = useState<Point | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isResizingBrush, setIsResizingBrush] = useState(false);
  const [tempBrushSize, setTempBrushSize] = useState(brushSize);
  const [fixedCursorPos, setFixedCursorPos] = useState<Point | null>(null);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });
  const panStartTransformRef = useRef<ViewTransform>({ zoom: 1, panX: 0, panY: 0 });
  const brushResizeStartRef = useRef<Point>({ x: 0, y: 0 });
  const originalBrushSizeRef = useRef<number>(brushSize);
  const historyManagerRef = useRef<CanvasHistoryManager>(new CanvasHistoryManager(50));
  const isDrawingRef = useRef<boolean>(false);

  // Initialize transparency pattern
  useEffect(() => {
    transparencyPatternRef.current = createTransparencyPatternCanvas(width, height, 10);
  }, [width, height]);

  // Initialize layer canvases when layers change
  useEffect(() => {
    const canvasMap = layerCanvasesRef.current;
    
    // Remove canvases for deleted layers
    for (const [layerId, canvas] of canvasMap.entries()) {
      if (!layers.find(layer => layer.id === layerId)) {
        canvasMap.delete(layerId);
      }
    }
    
    // Create canvases for new layers
    layers.forEach(layer => {
      if (!canvasMap.has(layer.id)) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx && layer.name === 'Background') {
          // Fill background layer with white initially, but allow transparency when erased
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }
        canvasMap.set(layer.id, canvas);
      }
    });
    
    // Composite all layers
    compositeAllLayers();
  }, [layers, width, height]);

  // Composite all visible layers into the main canvas
  const compositeAllLayers = useCallback(() => {
    const compositeCanvas = compositeCanvasRef.current;
    const transparencyPattern = transparencyPatternRef.current;
    if (!compositeCanvas) return;
    
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return;
    
    // Clear composite canvas
    ctx.clearRect(0, 0, width, height);
    
    // First, draw the transparency pattern as background
    if (transparencyPattern) {
      ctx.drawImage(transparencyPattern, 0, 0);
    }
    
    // Composite each visible layer in order
    layers.forEach(layer => {
      if (!layer.visible) return;
      
      const layerCanvas = layerCanvasesRef.current.get(layer.id);
      if (!layerCanvas) return;
      
      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      ctx.drawImage(layerCanvas, 0, 0);
      ctx.restore();
    });
  }, [layers, width, height]);

  // Update composite when layers change
  useEffect(() => {
    compositeAllLayers();
  }, [layers, compositeAllLayers]);

  // Undo function
  const performUndo = useCallback(() => {
    const action = historyManagerRef.current.undo();
    if (!action) return;

    if (action.beforeState) {
      // Restore the before state
      restoreAllLayersState(layerCanvasesRef.current, action.beforeState);
      compositeAllLayers();
    }
  }, [compositeAllLayers]);

  // Redo function  
  const performRedo = useCallback(() => {
    const action = historyManagerRef.current.redo();
    if (!action) return;

    if (action.afterState) {
      // Restore the after state
      restoreAllLayersState(layerCanvasesRef.current, action.afterState);
      compositeAllLayers();
    }
  }, [compositeAllLayers]);

  // Capture state before operation starts
  const beforeActionStateRef = useRef<Map<string, ImageData> | null>(null);

  // Start an action (capture before state)
  const startHistoryAction = useCallback(() => {
    beforeActionStateRef.current = captureAllLayersState(layerCanvasesRef.current);
  }, []);

  // End an action and save to history
  const endHistoryAction = useCallback((description: string, type: 'paint' | 'erase' | 'selection_delete') => {
    if (!beforeActionStateRef.current) return;
    
    const afterState = captureAllLayersState(layerCanvasesRef.current);
    
    historyManagerRef.current.addAction({
      type,
      layerId: activeLayerId,
      beforeState: beforeActionStateRef.current,
      afterState,
      description
    });
    
    beforeActionStateRef.current = null;
  }, [activeLayerId]);


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

  // Handle container-wide cursor preview
  useEffect(() => {
    const containerOverlay = containerOverlayRef.current;
    const container = containerRef.current;
    if (!containerOverlay || !container) return;
    
    const ctx = containerOverlay.getContext('2d');
    if (!ctx) return;
    
    // Clear the entire overlay
    ctx.clearRect(0, 0, containerOverlay.width, containerOverlay.height);
    
    // Only draw cursor preview for brush/eraser tools and when cursor position is available
    if (isPanning) return;
    if (activeTool !== 'brush' && activeTool !== 'eraser') return;
    if (!screenCursorPos) return;
    
    // Draw cursor preview at screen position
    const currentBrushSizeAtCursor = isResizingBrush ? (originalBrushSizeRef.current || brushSize) : brushSize;
    const radius = currentBrushSizeAtCursor / 2; // No zoom scaling needed for screen coordinates
    const alpha = isResizingBrush ? 0.4 : 0.7;
    
    ctx.setLineDash([]);
    
    // Draw white outline first
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.globalAlpha = alpha * 0.8;
    ctx.beginPath();
    ctx.arc(screenCursorPos.x, screenCursorPos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw colored circle on top
    ctx.strokeStyle = activeTool === 'brush' ? '#000000' : '#ff0000';
    ctx.lineWidth = 1;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(screenCursorPos.x, screenCursorPos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.globalAlpha = 1;
  }, [screenCursorPos, brushSize, activeTool, isPanning, isResizingBrush, containerSize]);

  // Clear cursor position when switching away from brush/eraser tools
  useEffect(() => {
    if (activeTool !== 'brush' && activeTool !== 'eraser') {
      setCursorPos(null);
      setScreenCursorPos(null);
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


  // Track container size for overlay canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize(); // Initial size
    
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    
    return () => resizeObserver.disconnect();
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
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
          // Start history action if not already drawing
          if (!isDrawingRef.current) {
            startHistoryAction();
            isDrawingRef.current = true;
          }
          
          setLastPos(pos);
          
          // Paint immediately on click (for single clicks)
          const activeLayerCanvas = layerCanvasesRef.current.get(activeLayerId);
          const ctx = activeLayerCanvas?.getContext('2d');
          const isBackground = layers.find(l => l.id === activeLayerId)?.name === 'Background';
          if (ctx) {
            paintAtPosition(ctx, pos, pos, activeTool, brushSize, brushHardness, brushOpacity, brushColor, viewTransform, isBackground);
            compositeAllLayers(); // Update the composite
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const currentPos = getMousePos(e, containerRef, viewTransform);
    const screenPos = getScreenPos(e, containerRef);

    // Update cursor position for preview (always for brush/eraser, regardless of mouse down state)
    if (activeTool === 'brush' || activeTool === 'eraser') {
      setCursorPos(currentPos);
      setScreenCursorPos(screenPos);
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

      const activeLayerCanvas = layerCanvasesRef.current.get(activeLayerId);
      const ctx = activeLayerCanvas?.getContext('2d');
      const isBackground = layers.find(l => l.id === activeLayerId)?.name === 'Background';
      if (!ctx) return;

      paintAtPosition(ctx, currentPos, lastPos, activeTool, brushSize, brushHardness, brushOpacity, brushColor, viewTransform, isBackground);
      compositeAllLayers(); // Update the composite
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
    
    // End drawing operation and save to history
    if (isDrawingRef.current) {
      endHistoryAction(`${activeTool} stroke`, activeTool === 'brush' ? 'paint' : 'erase');
      isDrawingRef.current = false;
    }
    
    // End brush resize
    if (isResizingBrush) {
      setIsResizingBrush(false);
      setFixedCursorPos(null); // Clear fixed position
      // No need to set brush size here since it's updated in real-time
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const currentPos = getMousePos(e, containerRef, viewTransform);
    const screenPos = getScreenPos(e, containerRef);
    if (activeTool === 'brush' || activeTool === 'eraser') {
      setCursorPos(currentPos);
      setScreenCursorPos(screenPos);
    }
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
    setScreenCursorPos(null);
  };


  const deleteSelectionArea = useCallback(() => {
    if (!selection) return;
    
    // Start history action
    startHistoryAction();
    
    const activeLayerCanvas = layerCanvasesRef.current.get(activeLayerId);
    const ctx = activeLayerCanvas?.getContext('2d');
    if (!ctx) return;

    // Save the current context state
    ctx.save();
    
    // Reset any transformations and composite operations
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    
    // Clear the selected area (make it transparent for all layers)
    ctx.clearRect(selection.x, selection.y, selection.width, selection.height);
    
    // Restore the context state
    ctx.restore();
    compositeAllLayers(); // Update the composite
    
    // End history action
    endHistoryAction('Delete selection', 'selection_delete');
  }, [selection, activeLayerId, layers, compositeAllLayers, startHistoryAction, endHistoryAction]);

  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    deleteSelection: deleteSelectionArea,
    undo: performUndo,
    redo: performRedo,
    canUndo: () => historyManagerRef.current.canUndo(),
    canRedo: () => historyManagerRef.current.canRedo()
  }), [deleteSelectionArea, performUndo, performRedo]);


  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        cursor: getCursor(isPanning, isResizingBrush, activeTool)
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
          ref={compositeCanvasRef}
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
          className="absolute top-0 left-0"
          style={{ 
            display: 'block'
          }}
        />
      </div>
      
      {/* Container-wide overlay for cursor preview */}
      <canvas
        ref={containerOverlayRef}
        width={containerSize.width}
        height={containerSize.height}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ 
          display: 'block'
        }}
      />
    </div>
  );
});

export default Canvas;