'use client';

import { useState, useEffect, useRef } from 'react';
import Canvas, { CanvasRef } from '@/components/Canvas';
import Toolbar from '@/components/Toolbar';
import { ToolType, Rectangle, ViewTransform } from '@/types/tools';

export default function Home() {
  const canvasRef = useRef<CanvasRef>(null);
  const selectionRef = useRef<Rectangle | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [brushSize, setBrushSize] = useState(40);
  const [brushHardness, setBrushHardness] = useState(100);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [brushColor, setBrushColor] = useState('#000000');
  const [selection, setSelection] = useState<Rectangle | null>(null);
  
  // Update ref when selection changes
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);
  const [viewTransform, setViewTransform] = useState<ViewTransform>({
    zoom: 1,
    panX: 0,
    panY: 0
  });

  const handleClearSelection = () => {
    setSelection(null);
  };

  const handleDeleteSelection = () => {
    if (!selection) return;
    canvasRef.current?.deleteSelection();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            setViewTransform(prev => ({
              ...prev,
              zoom: Math.min(5, prev.zoom * 1.2)
            }));
            break;
          case '-':
            e.preventDefault();
            setViewTransform(prev => ({
              ...prev,
              zoom: Math.max(0.1, prev.zoom * 0.8)
            }));
            break;
          case '0':
            e.preventDefault();
            setViewTransform({
              zoom: 1,
              panX: 0,
              panY: 0
            });
            break;
        }
      }
      
      // Tool shortcuts
      switch (e.key) {
        case 'b':
        case 'B':
          setActiveTool('brush');
          break;
        case 'e':
        case 'E':
          setActiveTool('eraser');
          break;
        case 's':
        case 'S':
          setActiveTool('selection');
          break;
        case 'h':
        case 'H':
          setActiveTool('pan');
          break;
      }

      // Delete key functionality
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const currentSelection = selectionRef.current;
        if (currentSelection) {
          canvasRef.current?.deleteSelection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getStatusText = () => {
    const toolName = activeTool === 'brush' ? 'Brush' : 
                     activeTool === 'eraser' ? 'Eraser' :
                     activeTool === 'selection' ? 'Selection' : 'Pan';
    const zoomInfo = ` | Zoom: ${Math.round(viewTransform.zoom * 100)}%`;
    const selectionInfo = selection 
      ? ` | Selection: ${Math.round(selection.width)}×${Math.round(selection.height)}` 
      : '';
    const brushInfo = (activeTool === 'brush' || activeTool === 'eraser') 
      ? ` | Size: ${brushSize}px | Opacity: ${brushOpacity}%${activeTool === 'brush' ? ` | Color: ${brushColor}` : ''}` 
      : '';
    
    return `${toolName} Tool${zoomInfo}${selectionInfo}${brushInfo}`;
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      <header 
        className="h-12 flex items-center px-4 border-b-2"
        style={{ 
          backgroundColor: 'var(--surface)', 
          borderColor: 'var(--border)',
          color: 'var(--text-primary)'
        }}
      >
        <h1 className="text-lg font-semibold">
          MiniShop Photo Editor
        </h1>
      </header>

      <div className="flex-1 flex">
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          brushHardness={brushHardness}
          setBrushHardness={setBrushHardness}
          brushOpacity={brushOpacity}
          setBrushOpacity={setBrushOpacity}
          brushColor={brushColor}
          setBrushColor={setBrushColor}
          onClearSelection={handleClearSelection}
          viewTransform={viewTransform}
          onViewTransformChange={setViewTransform}
        />
        
        <Canvas
          ref={canvasRef}
          width={800}
          height={600}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          brushHardness={brushHardness}
          brushOpacity={brushOpacity}
          brushColor={brushColor}
          activeTool={activeTool}
          selection={selection}
          onSelectionChange={setSelection}
          viewTransform={viewTransform}
          onViewTransformChange={setViewTransform}
        />
      </div>

      <footer 
        className="h-8 flex items-center px-4 border-t-2"
        style={{ 
          backgroundColor: 'var(--surface-dark)', 
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)'
        }}
      >
        <span className="text-xs">
          {getStatusText()}
        </span>
      </footer>
    </div>
  );
}
