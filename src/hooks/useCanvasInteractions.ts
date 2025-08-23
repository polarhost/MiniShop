import { useCallback } from 'react';
import { ViewTransform } from '@/types/tools';

export const useCanvasInteractions = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  viewTransform: ViewTransform,
  onViewTransformChange: (transform: ViewTransform) => void
) => {
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
  }, [viewTransform, onViewTransformChange, containerRef]);

  const getCursor = (
    isPanning: boolean,
    isResizingBrush: boolean,
    activeTool: string
  ) => {
    if (isPanning) return 'grabbing';
    if (isResizingBrush) return 'ew-resize'; // Horizontal resize cursor - keep system cursor visible
    
    switch (activeTool) {
      case 'brush':
        return 'none'; // Hide cursor since we show custom preview
      case 'eraser':
        return 'none'; // Hide cursor since we show custom preview
      case 'selection':
        return 'crosshair';
      case 'pan':
        return 'grab';
      default:
        return 'default';
    }
  };

  return {
    handleWheel,
    getCursor
  };
};