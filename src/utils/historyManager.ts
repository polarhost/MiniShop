export interface HistoryAction {
  type: 'paint' | 'erase' | 'selection_delete' | 'layer_add' | 'layer_delete' | 'layer_opacity' | 'layer_visibility' | 'layer_rename';
  layerId?: string;
  canvasState?: ImageData;
  beforeState?: Map<string, ImageData>; // State before the action
  afterState?: Map<string, ImageData>;  // State after the action
  // For layer property changes
  beforeValue?: any;
  afterValue?: any;
  timestamp: number;
  description: string;
}

export class CanvasHistoryManager {
  private history: HistoryAction[] = [];
  private currentIndex = -1;
  private maxHistorySize: number;

  constructor(maxHistorySize = 50) {
    this.maxHistorySize = maxHistorySize;
  }

  // Add a new action to history
  addAction(action: Omit<HistoryAction, 'timestamp'>) {
    // Remove any actions after current index (when undoing then making new action)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add the new action
    const fullAction: HistoryAction = {
      ...action,
      timestamp: Date.now()
    };
    
    this.history.push(fullAction);
    this.currentIndex++;
    
    // Trim history if it exceeds max size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  // Undo the last action
  undo(): HistoryAction | null {
    if (this.currentIndex < 0) return null;
    
    const action = this.history[this.currentIndex];
    this.currentIndex--;
    return action;
  }

  // Redo the next action
  redo(): HistoryAction | null {
    if (this.currentIndex >= this.history.length - 1) return null;
    
    this.currentIndex++;
    return this.history[this.currentIndex];
  }

  // Check if undo is available
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  // Check if redo is available
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // Get current history info
  getHistoryInfo() {
    return {
      currentIndex: this.currentIndex,
      totalActions: this.history.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }

  // Clear all history
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
}

// Utility functions for capturing canvas state
export const captureCanvasState = (canvas: HTMLCanvasElement): ImageData | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

export const restoreCanvasState = (canvas: HTMLCanvasElement, imageData: ImageData): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.putImageData(imageData, 0, 0);
};

export const captureAllLayersState = (layerCanvases: Map<string, HTMLCanvasElement>): Map<string, ImageData> => {
  const states = new Map<string, ImageData>();
  
  for (const [layerId, canvas] of layerCanvases.entries()) {
    const state = captureCanvasState(canvas);
    if (state) {
      states.set(layerId, state);
    }
  }
  
  return states;
};

export const restoreAllLayersState = (
  layerCanvases: Map<string, HTMLCanvasElement>, 
  states: Map<string, ImageData>
): void => {
  for (const [layerId, imageData] of states.entries()) {
    const canvas = layerCanvases.get(layerId);
    if (canvas) {
      restoreCanvasState(canvas, imageData);
    }
  }
};