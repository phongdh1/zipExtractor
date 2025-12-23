
// Declare gapi as a global constant to satisfy TypeScript compiler
declare const gapi: any;

import React, { useState, useMemo, useEffect } from 'react';
import { DriveFile, FileCategory } from '../types';

interface DrivePickerProps {
  onFileSelect: (id: string) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  accessToken: string | null;
}

interface FolderPath {
  id: string;
  name: string;
}

const getFileInfo = (mimeType: string, fileName: string): { type: FileCategory; icon: string; color: string } => {
  if (mimeType === 'application/vnd.google-apps.folder') return { type: 'FOLDER', icon: 'folder', color: 'text-amber-500' };
  if (mimeType === 'application/pdf') return { type: 'PDF', icon: 'picture_as_pdf', color: 'text-red-500' };
  
  if (mimeType.includes('image/')) return { type: 'IMAGE', icon: 'image', color: 'text-purple-500' };
  
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return { type: 'SHEET', icon: 'table_view', color: 'text-green-600' };
  if (mimeType.includes('document') || mimeType.includes('word')) return { type: 'DOC', icon: 'description', color: 'text-blue-600' };
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return { type: 'SLIDE', icon: 'slideshow', color: 'text-orange-500' };
  
  if (mimeType.includes('zip') || fileName.endsWith('.zip')) return { type: 'ZIP', icon: 'folder_zip', color: 'text-blue-500' };
  if (mimeType.includes('rar') || fileName.endsWith('.rar')) return { type: 'RAR', icon: 'inventory_2', color: 'text-purple-600' };
  if (mimeType.includes('7z') || fileName.endsWith('.7z')) return { type: '7Z', icon: 'archive', color: 'text-indigo-500' };
  
  return { type: 'FILE', icon: 'draft', color: 'text-gray-400' };
};

const DrivePicker: React.FC<DrivePickerProps> = ({ onFileSelect, darkMode, onToggleTheme, accessToken }) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [pathHistory, setPathHistory] = useState<FolderPath[]>([{ id: 'root', name: 'My Drive' }]);

  useEffect(() => {
    const listFiles = async () => {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const q = searchQuery 
          ? `name contains '${searchQuery}' and trashed = false`
          : `'${currentFolderId}' in parents and trashed = false`;

        const response = await gapi.client.drive.files.list({
          pageSize: 50,
          fields: 'nextPageToken, files(id, name, size, mimeType, modifiedTime)',
          q: q,
          orderBy: 'folder,name'
        });

        const driveFiles: DriveFile[] = response.result.files.map((file: any) => {
          const info = getFileInfo(file.mimeType, file.name);
          return {
            id: file.id,
            name: file.name,
            size: file.size ? `${(parseInt(file.size) / (1024 * 1024)).toFixed(1)} MB` : '--',
            type: info.type,
            mimeType: file.mimeType,
            lastModified: new Date(file.modifiedTime).toLocaleDateString(),
            color: info.color,
            icon: info.icon
          };
        });

        setFiles(driveFiles);
      } catch (error) {
        console.error('Error fetching drive files:', error);
      } finally {
        setIsLoading(false);
      }
    };

    listFiles();
  }, [accessToken, currentFolderId, searchQuery]);

  const handleFolderClick = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setPathHistory(prev => [...prev, { id: folderId, name: folderName }]);
    setSearchQuery('');
  };

  const navigateToPath = (index: number) => {
    const newHistory = pathHistory.slice(0, index + 1);
    const target = newHistory[newHistory.length - 1];
    setPathHistory(newHistory);
    setCurrentFolderId(target.id);
  };

  const toggleSelection = (file: DriveFile) => {
    if (file.type === 'FOLDER') {
      handleFolderClick(file.id, file.name);
      return;
    }
    
    // Chỉ cho phép chọn các định dạng nén để Extract
    const archiveTypes: FileCategory[] = ['ZIP', 'RAR', '7Z'];
    if (!archiveTypes.includes(file.type)) return;

    const newSelected = new Set(selectedIds);
    if (newSelected.has(file.id)) newSelected.delete(file.id);
    else {
      newSelected.clear(); 
      newSelected.add(file.id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark px-6 py-3 shrink-0 z-20">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg text-primary">
            <span className="material-symbols-outlined text-2xl filled">folder_zip</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight">ZIP Extractor Pro</h2>
        </div>
        <div className="flex flex-1 justify-end gap-3 items-center">
          <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
            <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <div className="size-9 rounded-full border border-gray-200 dark:border-gray-700 bg-cover bg-center shadow-sm" style={{ backgroundImage: 'url(https://api.dicebear.com/7.x/avataaars/svg?seed=Felix)' }}></div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white dark:bg-surface-dark border-r border-gray-200 dark:border-gray-800 flex-col hidden md:flex shrink-0">
          <div className="p-4 flex flex-col gap-6">
            <nav className="flex flex-col gap-1">
              <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider px-3 mb-2">Storage Sources</h3>
              <button 
                onClick={() => navigateToPath(0)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentFolderId === 'root' ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                <span className="material-symbols-outlined filled">cloud</span>
                My Drive
              </button>
            </nav>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-background-light dark:bg-background-dark overflow-hidden relative">
          <div className="px-6 pt-6 pb-2 flex flex-col gap-4 shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Drive Explorer</h1>
              <div className="relative w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 !text-lg">search</span>
                <input 
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                  placeholder="Search files..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {pathHistory.map((folder, idx) => (
                <React.Fragment key={folder.id}>
                  {idx > 0 && <span className="material-symbols-outlined text-gray-300 !text-sm">chevron_right</span>}
                  <button 
                    onClick={() => navigateToPath(idx)}
                    className={`text-xs font-bold whitespace-nowrap px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${idx === pathHistory.length - 1 ? 'text-primary' : 'text-gray-500'}`}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex-1 overflow-auto px-6 pb-32 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 text-sm font-medium animate-pulse">Syncing...</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-800">
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center"></th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4 w-32">Size</th>
                      <th className="py-3 px-4 w-40 text-right pr-8">Last Modified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {files.map((file) => (
                      <tr 
                        key={file.id} 
                        onClick={() => toggleSelection(file)}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group ${selectedIds.has(file.id) ? 'bg-primary/5' : ''}`}
                      >
                        <td className="py-3 px-4 text-center">
                          {['ZIP', 'RAR', '7Z'].includes(file.type) ? (
                            <input 
                              type="checkbox" 
                              checked={selectedIds.has(file.id)} 
                              readOnly
                              className="rounded text-primary focus:ring-primary/20 pointer-events-none" 
                            />
                          ) : (
                            <span className={`material-symbols-outlined !text-xl opacity-30 group-hover:opacity-100 ${file.color}`}>
                              {file.icon}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined filled ${file.color}`}>
                              {file.icon}
                            </span>
                            <span className="text-sm font-semibold truncate max-w-[400px] text-slate-700 dark:text-zinc-200">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-gray-500">{file.size}</td>
                        <td className="py-3 px-4 text-right pr-8 text-xs text-gray-400">{file.lastModified}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-4 px-6 flex items-center justify-between shadow-2xl z-30">
            <div className="flex items-center gap-4">
              {selectedIds.size > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-7 bg-primary rounded-full text-white text-[11px] font-black shadow-lg shadow-primary/20">
                    {selectedIds.size}
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Selected archive for extraction</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">Select a ZIP, RAR or 7Z file to proceed</span>
              )}
            </div>
            <button 
              onClick={() => onFileSelect(Array.from(selectedIds)[0])}
              disabled={selectedIds.size === 0}
              className="px-8 py-2.5 rounded-xl bg-primary text-white text-sm font-black flex items-center gap-3 hover:bg-blue-600 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              Next <span className="material-symbols-outlined !text-lg">arrow_forward</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DrivePicker;
