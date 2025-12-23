// Declare gapi as a global constant to satisfy TypeScript compiler
declare const gapi: any;

import React, { useState, useMemo, useEffect } from 'react';
import { DriveFile } from '../types';

interface DrivePickerProps {
  onFileSelect: (id: string) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  accessToken: string | null;
}

const DrivePicker: React.FC<DrivePickerProps> = ({ onFileSelect, darkMode, onToggleTheme, accessToken }) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch files from Google Drive
  useEffect(() => {
    const listFiles = async () => {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        // Fix: Access global gapi.client
        const response = await gapi.client.drive.files.list({
          pageSize: 20,
          fields: 'nextPageToken, files(id, name, size, mimeType, modifiedTime)',
          // Lọc các file nén phổ biến hoặc folder
          q: "mimeType = 'application/zip' or mimeType = 'application/x-zip-compressed' or mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/x-rar-compressed' or mimeType = 'application/x-7z-compressed'",
        });

        const driveFiles: DriveFile[] = response.result.files.map((file: any) => ({
          id: file.id,
          name: file.name,
          size: file.size ? `${(parseInt(file.size) / (1024 * 1024)).toFixed(1)} MB` : '-',
          type: file.mimeType === 'application/vnd.google-apps.folder' ? 'FOLDER' : 'ZIP',
          lastModified: new Date(file.modifiedTime).toLocaleDateString(),
          color: file.mimeType === 'application/vnd.google-apps.folder' ? 'text-blue-500' : 'text-red-500'
        }));

        setFiles(driveFiles);
      } catch (error) {
        console.error('Error fetching drive files:', error);
      } finally {
        setIsLoading(false);
      }
    };

    listFiles();
  }, [accessToken]);

  const filteredFiles = useMemo(() => {
    return files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, files]);

  const toggleSelection = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file?.type === 'FOLDER') return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark px-6 py-3 shrink-0 z-20">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg text-primary">
            <span className="material-symbols-outlined text-2xl filled">folder_zip</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight">ZIP Extractor</h2>
        </div>
        <div className="flex flex-1 justify-end gap-3 items-center">
          <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <div className="size-9 rounded-full border border-gray-200 dark:border-gray-700 bg-cover bg-center" style={{ backgroundImage: 'url(https://picsum.photos/100/100?random=1)' }}></div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white dark:bg-surface-dark border-r border-gray-200 dark:border-gray-800 flex-col hidden md:flex shrink-0">
          <div className="p-4 flex flex-col gap-6">
            <nav className="flex flex-col gap-1">
              <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider px-3 mb-1">Sources</h3>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-primary/10 text-primary">
                <span className="material-symbols-outlined filled">hard_drive</span>
                My Drive (Live)
              </button>
            </nav>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-background-light dark:bg-background-dark overflow-hidden">
          <div className="px-6 py-6 flex flex-col gap-6 shrink-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Select Archive from Google Drive</h1>
            
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 !text-lg">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                placeholder="Search real files..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto px-6 pb-24 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 text-sm font-medium">Accessing your Google Drive...</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center"></th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4 w-32">Size</th>
                      <th className="py-3 px-4 w-40">Type</th>
                      <th className="py-3 px-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredFiles.map((file) => (
                      <tr 
                        key={file.id} 
                        onClick={() => toggleSelection(file.id)}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${selectedIds.has(file.id) ? 'bg-primary/5' : ''}`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.has(file.id)} 
                            disabled={file.type === 'FOLDER'}
                            readOnly
                            className="rounded text-primary focus:ring-primary/20" 
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined filled ${file.color}`}>{file.type === 'FOLDER' ? 'folder' : 'folder_zip'}</span>
                            <span className="text-sm font-medium truncate max-w-[300px]">{file.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{file.size}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            {file.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-400">
                          <span className="material-symbols-outlined">more_vert</span>
                        </td>
                      </tr>
                    ))}
                    {filteredFiles.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-gray-500">
                          <span className="material-symbols-outlined text-4xl mb-2">cloud_off</span>
                          <p>No archives found in your Drive.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 p-4 px-6 md:px-10 flex items-center justify-between shadow-lg z-30">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-6 bg-primary rounded-full text-white text-[10px] font-bold">{selectedIds.size}</div>
              <span className="text-sm font-medium">real files selected</span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => onFileSelect(Array.from(selectedIds)[0])}
                disabled={selectedIds.size === 0}
                className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50 transition-all"
              >
                Extract Real Data <span className="material-symbols-outlined !text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DrivePicker;