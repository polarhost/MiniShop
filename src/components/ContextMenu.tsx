'use client';

import React from 'react';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  action: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isVisible,
  position,
  items,
  onClose
}) => {
  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop to close menu */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div
        className="fixed z-50 py-1 border rounded-md shadow-lg backdrop-blur-sm"
        style={{
          left: position.x,
          top: position.y,
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          minWidth: '150px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (!item.disabled) {
                  item.action();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                item.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-white hover:bg-opacity-10 cursor-pointer'
              }`}
              style={{ 
                color: 'var(--text-primary)',
                textAlign: 'left'
              }}
            >
              <IconComponent fontSize="small" />
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default ContextMenu;