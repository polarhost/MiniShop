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
  onLayerRename: (layerId: string, newName: string) => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onLayerSelect,
  onLayerToggleVisibility,
  onLayerDelete,
  onLayerAdd,
  onOpacityChange,
  onLayerRename
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelSize, setPanelSize] = useState({ width: 250, height: 300 });
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const handleStartRename = (layerId: string, currentName: string) => {
    setEditingLayerId(layerId);
    setEditingName(currentName);
  };

  const handleConfirmRename = (layerId: string) => {
    const trimmedName = editingName.trim();
    const currentLayer = layers.find(l => l.id === layerId);
    
    if (trimmedName && trimmedName !== currentLayer?.name) {
      // Check for duplicate names
      const isDuplicate = layers.some(l => l.id !== layerId && l.name === trimmedName);
      if (isDuplicate) {
        // Add a number suffix to make it unique
        let counter = 1;
        let uniqueName = `${trimmedName} ${counter}`;
        while (layers.some(l => l.name === uniqueName)) {
          counter++;
          uniqueName = `${trimmedName} ${counter}`;
        }
        onLayerRename(layerId, uniqueName);
      } else {
        onLayerRename(layerId, trimmedName);
      }
    } else if (!trimmedName && currentLayer) {
      // If empty, revert to current name
      setEditingName(currentLayer.name);
      return; // Don't close the edit mode
    }
    
    setEditingLayerId(null);
    setEditingName('');
  };

  const handleCancelRename = () => {
    setEditingLayerId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, layerId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmRename(layerId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelRename();
    }
  };

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
                  {editingLayerId === layer.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleConfirmRename(layer.id)}
                      onKeyDown={(e) => handleKeyDown(e, layer.id)}
                      onFocus={(e) => e.target.select()}
                      className="text-sm font-medium rounded px-1 flex-1 mr-2 outline-none"
                      style={{ 
                        color: 'inherit',
                        backgroundColor: activeLayerId === layer.id ? 'rgba(255,255,255,0.1)' : 'var(--surface-light)',
                        border: `1px solid ${activeLayerId === layer.id ? 'rgba(255,255,255,0.3)' : 'var(--border)'}`
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span 
                      className="text-sm font-medium truncate flex-1 mr-2 cursor-pointer"
                      onDoubleClick={() => handleStartRename(layer.id, layer.name)}
                      title="Double-click to rename"
                    >
                      {layer.name}
                    </span>
                  )}
                  
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
          
          {/* Add Layer Button - Bottom */}
          <div className="p-2 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={onLayerAdd}
              className="w-8 h-8 flex items-center justify-center rounded-md transition-all duration-75 hover:shadow-md hover:scale-105"
              style={{ 
                backgroundColor: 'var(--surface-light)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-light)';
              }}
              title="Add New Layer"
            >
              <AddIcon fontSize="small" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LayersPanel;