import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, Plus, MoreVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface Folder {
  folder_id: number;
  folder_name: string;
  project_id: number;
  created_at: string;
}

interface DocumentFolderTreeProps {
  projectId: number;
  folders: Folder[];
  selectedFolder: Folder | null;
  onSelectFolder: (folder: Folder) => void;
  onCreateFolder?: (name: string) => Promise<void>;
  onDeleteFolder?: (folderId: number) => Promise<void>;
}

export default function DocumentFolderTree({
  projectId,
  folders,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
}: DocumentFolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const toggleFolder = (folderId: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !onCreateFolder) return;

    setCreating(true);
    try {
      await onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateModal(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-gray-900">Folders</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCreateModal(true)}
            className="h-7 w-7 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {folders.map((folder) => (
          <FolderNode
            key={folder.folder_id}
            folder={folder}
            isSelected={selectedFolder?.folder_id === folder.folder_id}
            isExpanded={expandedFolders.has(folder.folder_id)}
            onSelect={() => onSelectFolder(folder)}
            onToggle={() => toggleFolder(folder.folder_id)}
            onDelete={onDeleteFolder ? () => onDeleteFolder(folder.folder_id) : undefined}
          />
        ))}
      </div>

      {/* Create Folder Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || creating}
              >
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FolderNodeProps {
  folder: Folder;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDelete?: () => void;
}

function FolderNode({
  folder,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
  onDelete,
}: FolderNodeProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer group ${
          isSelected
            ? 'bg-blue-100 text-blue-700'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        onClick={onSelect}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-0"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <Folder className="w-4 h-4" />
        <span className="flex-1 text-sm truncate">{folder.folder_name}</span>
        {onDelete && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete folder "${folder.folder_name}"?`)) {
                      onDelete();
                    }
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
