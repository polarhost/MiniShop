import { Point, Rectangle, ViewTransform } from '@/types/tools';

export const getMousePos = (
  e: React.MouseEvent<HTMLCanvasElement>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  viewTransform: ViewTransform
): Point => {
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

export const getScreenPos = (
  e: React.MouseEvent<HTMLCanvasElement>,
  containerRef: React.RefObject<HTMLDivElement | null>
): Point => {
  const container = containerRef.current;
  if (!container) return { x: 0, y: 0 };

  const rect = container.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
};

export const isPointInSelection = (point: Point, selection: Rectangle | null): boolean => {
  if (!selection) {
    return true;
  }
  
  const inSelection = point.x >= selection.x && 
         point.x <= selection.x + selection.width &&
         point.y >= selection.y && 
         point.y <= selection.y + selection.height;
  
  return inSelection;
};