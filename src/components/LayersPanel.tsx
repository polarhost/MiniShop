'use client';

import React, { useState } from 'react';
import LayersIcon from '@mui/icons-material/Layers';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
}

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onLayerSelect: (layerId: string) => void;
  onLayerToggleVisibility: (layerId: string) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerAdd: () => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onLayerSelect,
  onLayerToggleVisibility,
  onLayerDelete,
  onLayerAdd,
  onOpacityChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelSize, setPanelSize] = useState({ width: 250, height: 300 });

  return (
    <div 
      className="absolute bottom-4 right-4 flex flex-col border-2 shadow-lg bg-opacity-95 backdrop-blur-sm"
      style={{ 
        backgroundColor: 'var(--surface)', 
        borderColor: 'var(--border)',
        width: isCollapsed ? 'auto' : panelSize.width,
        height: isCollapsed ? 'auto' : panelSize.height,
        minWidth: isCollapsed ? 'auto' : 200,
        minHeight: isCollapsed ? 'auto' : 200,
        maxWidth: 400,
        maxHeight: '60vh'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-2 border-b-2 cursor-pointer"
        style={{ 
          backgroundColor: 'var(--surface-dark)', 
          borderColor: 'var(--border)',
          color: 'var(--text-primary)'
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <LayersIcon fontSize="small" />
          <span className="text-sm font-medium">Layers</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {isCollapsed ? '▲' : '▼'}
        </span>
      </div>

      {!isCollapsed && (
        <>
          {/* Add Layer Button */}
          <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={onLayerAdd}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-md transition-colors hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--surface-light)',
                color: 'var(--text-primary)'
              }}
            >
              <AddIcon fontSize="small" />
              <span className="text-sm">New Layer</span>
            </button>
          </div>

          {/* Layers List */}
          <div className="flex-1 overflow-y-auto">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={`p-2 border-b cursor-pointer transition-colors ${
                  activeLayerId === layer.id ? 'shadow-inner' : 'hover:shadow-sm'
                }`}
                style={{ 
                  backgroundColor: activeLayerId === layer.id ? 'var(--accent)' : 'transparent',
                  borderColor: 'var(--border)',
                  color: activeLayerId === layer.id ? '#ffffff' : 'var(--text-primary)'
                }}
                onClick={() => onLayerSelect(layer.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate flex-1 mr-2">
                    {layer.name}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerToggleVisibility(layer.id);
                      }}
                      className="p-1 rounded transition-colors hover:bg-black hover:bg-opacity-10"
                    >
                      {layer.visible ? (
                        <VisibilityIcon fontSize="small" />
                      ) : (
                        <VisibilityOffIcon fontSize="small" />
                      )}
                    </button>
                    
                    {layers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerDelete(layer.id);
                        }}
                        className="p-1 rounded transition-colors hover:bg-red-500 hover:bg-opacity-20"
                        style={{ color: 'var(--error)' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Opacity Slider */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Opacity:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={layer.opacity}
                    onChange={(e) => {
                      e.stopPropagation();
                      onOpacityChange(layer.id, parseInt(e.target.value));
                    }}
                    className="flex-1 h-1 rounded cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${layer.opacity}%, var(--border) ${layer.opacity}%, var(--border) 100%)`
                    }}
                  />
                  <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>
                    {layer.opacity}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LayersPanel;