
// Declare gapi as a global constant
declare const gapi: any;

import React, { useState, useEffect } from 'react';

interface DestinationPickerProps {
  onCancel: () => void;
  onConfirm: (config: any) => void;
  accessToken: string | null;
  archiveName: string;
  mode?: 'extract' | 'compress';
}

export interface ExtractionConfig {
  destinationFolderId: string;
  createSubfolder: boolean;
  conflictResolution: 'keep' | 'overwrite' | 'skip';
  zipFileName?: string;
}

interface FolderPath {
  id: string;
  name: string;
}

const DestinationPicker: React.FC<DestinationPickerProps> = ({ 
  onCancel, 
  onConfirm, 
  accessToken, 
  archiveName,
  mode = 'extract'
}) => {
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [pathHistory, setPathHistory] = useState<FolderPath[]>([{ id: 'root', name: 'My Drive' }]);
  
  // Options states
  const [createSubfolder, setCreateSubfolder] = useState(true);
  const [conflictResolution, setConflictResolution] = useState<'keep' | 'overwrite' | 'skip'>('keep');
  const [zipFileName, setZipFileName] = useState(() => {
    if (mode === 'compress') return `Archive_${new Date().getTime()}.zip`;
    return '';
  });

  // Fetch folders
  useEffect(() => {
    const fetchFolders = async () => {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const response = await gapi.client.drive.files.list({
          q: `'${currentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
          fields: 'files(id, name, mimeType)',
          orderBy: 'name',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true
        });
        setFolders(response.result.files || []);
      } catch (error) {
        console.error('Error fetching folders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFolders();
  }, [accessToken, currentFolderId]);

  const handleFolderClick = (id: string, name: string) => {
    setCurrentFolderId(id);
    setPathHistory(prev => [...prev, { id, name }]);
  };

  const navigateToPath = (index: number) => {
    const newHistory = pathHistory.slice(0, index + 1);
    const target = newHistory[newHistory.length - 1];
    setPathHistory(newHistory);
    setCurrentFolderId(target.id);
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter new folder name:');
    if (!folderName) return;

    try {
      const response = await gapi.client.drive.files.create({
        resource: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentFolderId]
        },
        supportsAllDrives: true
      });
      const newFolder = response.result;
      setFolders(prev => [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      alert('Failed to create folder');
    }
  };

  const isCompress = mode === 'compress';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="w-full max-w-4xl bg-white dark:bg-surface-dark rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 h-[80vh]">
        
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black tracking-tight">
              {isCompress ? 'Create ZIP Archive' : 'Extract to Google Drive'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-gray-400 !text-lg">
                {isCompress ? 'folder_zip' : 'unarchive'}
              </span>
              <p className="text-gray-500 text-sm">
                {isCompress ? 'Selected Items: ' : 'Source: '}
                <span className="font-bold text-slate-900 dark:text-gray-200">{archiveName}</span>
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Destination Selection */}
          <div className="flex-1 flex flex-col p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Select Destination Folder</h3>
              <button 
                onClick={handleCreateFolder}
                className="flex items-center gap-1 text-primary hover:text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined !text-lg">create_new_folder</span> New Folder
              </button>
            </div>

            <nav className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-400 overflow-x-auto py-1 whitespace-nowrap mb-4 no-scrollbar">
              {pathHistory.map((folder, idx) => (
                <React.Fragment key={folder.id}>
                  {idx > 0 && <span className="material-symbols-outlined !text-sm">chevron_right</span>}
                  <button 
                    onClick={() => navigateToPath(idx)}
                    className={`hover:text-primary transition-colors ${idx === pathHistory.length - 1 ? 'text-slate-900 dark:text-white' : ''}`}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  {pathHistory.length > 1 && (
                    <div 
                      onClick={() => navigateToPath(pathHistory.length - 2)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-400"
                    >
                      <span className="material-symbols-outlined">arrow_upward</span>
                      <span className="text-sm font-bold">Go Back</span>
                    </div>
                  )}
                  {folders.map((folder) => (
                    <div 
                      key={folder.id} 
                      onClick={() => handleFolderClick(folder.id, folder.name)}
                      className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="material-symbols-outlined filled text-amber-500">folder</span>
                        <span className="text-sm font-medium truncate">{folder.name}</span>
                      </div>
                      <span className="material-symbols-outlined text-gray-300 !text-lg group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </div>
                  ))}
                  {folders.length === 0 && !isLoading && (
                    <div className="text-center py-10 text-gray-400 italic text-sm">No subfolders here</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Options Side Pane */}
          <div className="w-full md:w-[320px] bg-gray-50 dark:bg-gray-900/50 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            {isCompress && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Zip File Name</h3>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 !text-sm">edit</span>
                  <input 
                    type="text"
                    value={zipFileName}
                    onChange={(e) => setZipFileName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Archive.zip"
                  />
                </div>
              </div>
            )}

            {!isCompress && (
              <>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Extraction Options</h3>
                  <label className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary/50 transition-colors shadow-sm">
                    <input 
                      type="checkbox" 
                      checked={createSubfolder} 
                      onChange={(e) => setCreateSubfolder(e.target.checked)}
                      className="mt-1 rounded text-primary focus:ring-primary/20" 
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">Create subfolder</span>
                      <span className="text-[10px] text-gray-500 font-bold leading-tight mt-1 uppercase tracking-wide">
                        Put files inside folder "{archiveName.replace(/\.[^/.]+$/, "")}"
                      </span>
                    </div>
                  </label>
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-800 w-full"></div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Conflict Resolution</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-4">If a file already exists:</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'keep', label: 'Rename (Keep both)' },
                      { id: 'overwrite', label: 'Overwrite existing' },
                      { id: 'skip', label: 'Skip files' }
                    ].map((opt) => (
                      <label 
                        key={opt.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${conflictResolution === opt.id ? 'bg-white dark:bg-gray-800 border-primary shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800'}`}
                      >
                        <input 
                          type="radio" 
                          name="conflict" 
                          checked={conflictResolution === opt.id}
                          onChange={() => setConflictResolution(opt.id as any)}
                          className="text-primary focus:ring-primary/20" 
                        />
                        <span className="text-xs font-bold">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="mt-auto bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3 items-start border border-blue-100 dark:border-blue-900/30">
              <span className="material-symbols-outlined text-primary !text-lg mt-0.5">info</span>
              <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider leading-relaxed">
                Target Location: <strong>{pathHistory[pathHistory.length - 1].name}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end items-center gap-3 bg-white dark:bg-surface-dark">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
          <button 
            onClick={() => onConfirm({
              destinationFolderId: currentFolderId,
              createSubfolder,
              conflictResolution,
              zipFileName
            })}
            className="px-6 py-2.5 rounded-lg text-sm font-bold bg-primary text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined !text-lg">
              {isCompress ? 'archive' : 'unarchive'}
            </span> 
            {isCompress ? 'Create Zip' : 'Extract Here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationPicker;
