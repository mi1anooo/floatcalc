import { useState } from 'react';
import { CalculationEntry, Folder } from '../types';
import { formatTimestamp } from '../utils/calculator';
import './HistoryPanel.css';

interface HistoryPanelProps {
  history: CalculationEntry[];
  folders: Folder[];
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onAssignFolder: (id: string, folderId: string | undefined) => void;
  onClearAll: () => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  /* If provided, clicking a result re-populates the calculator */
  onLoadEntry?: (entry: CalculationEntry) => void;
}

export function HistoryPanel({
  history,
  folders,
  onDelete,
  onRename,
  onAssignFolder,
  onClearAll,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onLoadEntry,
}: HistoryPanelProps) {
  const [search, setSearch] = useState('');
  const [activeFolderId, setActiveFolderId] = useState<string | 'all' | 'unsorted'>('all');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntryName, setEditingEntryName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  // Filter history
  const filtered = history.filter((e) => {
    const matchesSearch =
      !search ||
      e.expression.toLowerCase().includes(search.toLowerCase()) ||
      e.result.toLowerCase().includes(search.toLowerCase()) ||
      (e.name ?? '').toLowerCase().includes(search.toLowerCase());

    const matchesFolder =
      activeFolderId === 'all' ||
      (activeFolderId === 'unsorted' ? !e.folderId : e.folderId === activeFolderId);

    return matchesSearch && matchesFolder;
  });

  // Commit entry rename
  const commitEntryRename = (id: string) => {
    if (editingEntryName.trim()) onRename(id, editingEntryName.trim());
    setEditingEntryId(null);
  };

  // Commit folder rename
  const commitFolderRename = (id: string) => {
    if (editingFolderName.trim()) onRenameFolder(id, editingFolderName.trim());
    setEditingFolderId(null);
  };

  // Create new folder
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  return (
    <div className="history-panel">
      {/* Search bar */}
      <div className="history-panel__search-row">
        <input
          className="history-panel__search"
          type="text"
          placeholder="Search calculations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="history-panel__clear-btn" onClick={onClearAll} title="Clear all history">
          Clear all
        </button>
      </div>

      {/* Folder sidebar */}
      <div className="history-panel__body">
        <div className="history-panel__folders">
          {[
            { id: 'all', label: 'All' },
            { id: 'unsorted', label: 'Unsorted' },
            ...folders.map((f) => ({ id: f.id, label: f.name, folder: f })),
          ].map((item) => (
            <div
              key={item.id}
              className={`history-panel__folder ${activeFolderId === item.id ? 'active' : ''}`}
            >
              {editingFolderId === item.id && 'folder' in item ? (
                <input
                  className="history-panel__folder-input"
                  value={editingFolderName}
                  autoFocus
                  onChange={(e) => setEditingFolderName(e.target.value)}
                  onBlur={() => commitFolderRename(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitFolderRename(item.id);
                    if (e.key === 'Escape') setEditingFolderId(null);
                  }}
                />
              ) : (
                <span
                  className="history-panel__folder-label"
                  onClick={() => setActiveFolderId(item.id as typeof activeFolderId)}
                  onDoubleClick={() => {
                    if ('folder' in item && item.folder) {
                      setEditingFolderId(item.id);
                      setEditingFolderName(item.label);
                    }
                  }}
                >
                  {item.label}
                </span>
              )}
              {'folder' in item && item.folder && (
                <button
                  className="history-panel__folder-del"
                  onClick={() => onDeleteFolder(item.id)}
                  title="Delete folder"
                >×</button>
              )}
            </div>
          ))}

          {/* New folder */}
          {showNewFolder ? (
            <div className="history-panel__folder">
              <input
                className="history-panel__folder-input"
                autoFocus
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={handleCreateFolder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') setShowNewFolder(false);
                }}
              />
            </div>
          ) : (
            <button
              className="history-panel__new-folder"
              onClick={() => setShowNewFolder(true)}
            >
              + Folder
            </button>
          )}
        </div>

        {/* History entries */}
        <div className="history-panel__entries">
          {filtered.length === 0 && (
            <div className="history-panel__empty">No calculations yet</div>
          )}
          {filtered.map((entry) => (
            <div key={entry.id} className="history-card">
              <div className="history-card__top">
                {/* Name or expression */}
                {editingEntryId === entry.id ? (
                  <input
                    className="history-card__name-input"
                    autoFocus
                    value={editingEntryName}
                    onChange={(e) => setEditingEntryName(e.target.value)}
                    onBlur={() => commitEntryRename(entry.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEntryRename(entry.id);
                      if (e.key === 'Escape') setEditingEntryId(null);
                    }}
                  />
                ) : (
                  <span
                    className="history-card__name"
                    onDoubleClick={() => {
                      setEditingEntryId(entry.id);
                      setEditingEntryName(entry.name ?? entry.expression);
                    }}
                    onClick={() => onLoadEntry?.(entry)}
                    title="Click to load · Double-click to rename"
                  >
                    {entry.name || entry.expression}
                  </span>
                )}

                {/* Actions */}
                <div className="history-card__actions">
                  <button
                    className="history-card__action"
                    title="Rename"
                    onClick={() => {
                      setEditingEntryId(entry.id);
                      setEditingEntryName(entry.name ?? entry.expression);
                    }}
                  >✎</button>
                  <button
                    className="history-card__action history-card__action--del"
                    title="Delete"
                    onClick={() => onDelete(entry.id)}
                  >×</button>
                </div>
              </div>

              {/* Expression + result */}
              <div className="history-card__expr">{entry.expression}</div>
              <div className="history-card__result">= {entry.result}</div>

              {/* Bottom row: folder + timestamp */}
              <div className="history-card__meta">
                <select
                  className="history-card__folder-select"
                  value={entry.folderId ?? ''}
                  onChange={(e) =>
                    onAssignFolder(entry.id, e.target.value || undefined)
                  }
                >
                  <option value="">Unsorted</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <span className="history-card__time">
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
