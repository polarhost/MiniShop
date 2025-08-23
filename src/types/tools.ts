export type ToolType = 'brush' | 'eraser' | 'selection' | 'pan';

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewTransform {
  zoom: number;
  panX: number;
  panY: number;
}

export interface Tool {
  id: ToolType;
  name: string;
  icon: React.ComponentType;
  cursor: string;
}

export interface ToolState {
  activeTool: ToolType;
  brushSize: number;
  brushColor: string;
  selection: Rectangle | null;
  viewTransform: ViewTransform;
}