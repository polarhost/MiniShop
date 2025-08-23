'use client';

import { useState, useRef, useEffect } from 'react';
import BrushIcon from '@mui/icons-material/Brush';
import CropFreeIcon from '@mui/icons-material/CropFree';
import PanToolIcon from '@mui/icons-material/PanTool';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { ToolType, ViewTransform } from '@/types/tools';
import NumericInput from './NumericInput';

interface ToolbarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushHardness: number;
  setBrushHardness: (hardness: number) => void;
  brushColor: string;
  setBrushColor: (color: string) => void;
  onClearSelection: () => void;
  viewTransform: ViewTransform;
  onViewTransformChange: (transform: ViewTransform) => void;
}

export default function Toolbar({ 
  activeTool,
  setActiveTool,
  brushSize, 
  setBrushSize,
  brushHardness,
  setBrushHardness,
  brushColor, 
  setBrushColor,
  onClearSelection,
  viewTransform = { zoom: 1, panX: 0, panY: 0 },
  onViewTransformChange
}: ToolbarProps) {
  const [toolbarWidth, setToolbarWidth] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  const colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

  const tools = [
    { id: 'brush' as ToolType, icon: BrushIcon, title: 'Brush Tool' },
    { id: 'selection' as ToolType, icon: CropFreeIcon, title: 'Rectangle Selection' },
    { id: 'pan' as ToolType, icon: PanToolIcon, title: 'Pan Tool' }
  ];

  const handleZoomIn = () => {
    const newZoom = Math.min(5, viewTransform.zoom * 1.2);
    onViewTransformChange({
      ...viewTransform,
      zoom: newZoom
    });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, viewTransform.zoom * 0.8);
    onViewTransformChange({
      ...viewTransform,
      zoom: newZoom
    });
  };

  const handleResetView = () => {
    onViewTransformChange({
      zoom: 1,
      panX: 0,
      panY: 0
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = Math.max(160, Math.min(400, e.clientX));
    setToolbarWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  return (
    <div 
      className="relative flex border-r-2"
      style={{ 
        width: toolbarWidth,
        backgroundColor: 'var(--surface)', 
        borderColor: 'var(--border)' 
      }}
    >
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-wrap gap-2 mb-4">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`w-10 h-10 rounded-lg transition-colors flex items-center justify-center ${
                  activeTool === tool.id ? 'shadow-inner' : 'hover:shadow-md'
                }`}
                style={{
                  backgroundColor: activeTool === tool.id ? 'var(--accent)' : 'var(--surface-light)',
                  color: activeTool === tool.id ? '#ffffff' : 'var(--text-primary)'
                }}
                title={tool.title}
              >
                <IconComponent fontSize="small" />
              </button>
            );
          })}
        </div>

        <div className="border-t pt-4 mb-4" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
            COLORS
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setBrushColor(color)}
                className={`w-6 h-6 rounded border-2 transition-all ${
                  brushColor === color ? 'scale-110 shadow-md' : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: color,
                  borderColor: brushColor === color ? 'var(--accent)' : 'var(--border-light)'
                }}
                title={color}
              />
            ))}
          </div>
          
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-8 h-8 rounded border-2 cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          />
        </div>

        <div className="border-t pt-4 mb-4" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
            VIEW
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 rounded transition-colors hover:shadow-sm flex items-center justify-center"
              style={{
                backgroundColor: 'var(--surface-light)',
                color: 'var(--text-primary)'
              }}
              title="Zoom In"
            >
              <ZoomInIcon fontSize="small" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 rounded transition-colors hover:shadow-sm flex items-center justify-center"
              style={{
                backgroundColor: 'var(--surface-light)',
                color: 'var(--text-primary)'
              }}
              title="Zoom Out"
            >
              <ZoomOutIcon fontSize="small" />
            </button>
            <button
              onClick={handleResetView}
              className="w-8 h-8 rounded transition-colors hover:shadow-sm flex items-center justify-center"
              style={{
                backgroundColor: 'var(--surface-light)',
                color: 'var(--text-primary)'
              }}
              title="Reset View"
            >
              <CenterFocusStrongIcon fontSize="small" />
            </button>
          </div>
          
          <div className="text-xs text-center mb-3" style={{ color: 'var(--text-muted)' }}>
            Zoom: {Math.round(viewTransform.zoom * 100)}%
          </div>
          
          <button
            onClick={onClearSelection}
            className="w-full text-xs px-3 py-2 rounded transition-colors hover:shadow-sm"
            style={{
              backgroundColor: 'var(--surface-light)',
              color: 'var(--text-secondary)'
            }}
            title="Clear Selection"
          >
            Clear Selection
          </button>
        </div>

        {activeTool === 'brush' && (
          <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
              BRUSH
            </h3>
            
            <div className="space-y-4">
              <NumericInput
                value={brushSize}
                onChange={setBrushSize}
                min={1}
                max={100}
                label="Size"
                suffix="px"
              />
              
              <NumericInput
                value={brushHardness}
                onChange={setBrushHardness}
                min={0}
                max={100}
                label="Hardness"
                suffix="%"
              />
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        className="w-1 cursor-col-resize hover:bg-accent transition-colors flex items-center justify-center"
        style={{ backgroundColor: isResizing ? 'var(--accent)' : 'var(--border)' }}
        title="Resize Panel"
      >
        <DragIndicatorIcon 
          fontSize="small" 
          style={{ 
            color: 'var(--text-muted)', 
            transform: 'rotate(90deg)',
            fontSize: '12px'
          }} 
        />
      </div>
    </div>
  );
}