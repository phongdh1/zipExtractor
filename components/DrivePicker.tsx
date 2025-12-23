
import React, { useState, useMemo } from 'react';
import { DriveFile } from '../types';

interface DrivePickerProps {
  onFileSelect: (id: string) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

const DrivePicker: React.FC<DrivePickerProps> = ({ onFileSelect, darkMode, onToggleTheme }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['1']));
  const [searchQuery, setSearchQuery] = useState('');

  const files: DriveFile[] = [
    { id: '1', name: 'project-backup-2023.zip', size: '125 MB', type: 'ZIP', lastModified: 'Oct 24, 2023', color: 'text-red-500' },
    { id: '2', name: 'old-photos.rar', size: '1.2 GB', type: 'RAR', lastModified: 'Sep 15, 2023', color: 'text-purple-500' },
    { id: '3', name: 'website-assets', size: '-', type: 'FOLDER', lastModified: 'Aug 02, 2023', color: 'text-gray-500' },
    { id: '4', name: 'financial-reports.7z', size: '45 MB', type: '7Z', lastModified: 'Jul 20, 2023', color: 'text-green-500' },
    { id: '5', name: 'client-deliverables.zip', size: '256 MB', type: 'ZIP', lastModified: 'Jun 10, 2023', color: 'text-red-500' },
  ];

  const filteredFiles = useMemo(() => {
    return files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, files]);

  const toggleSelection = (id: string) => {
    if (files.find(f => f.id === id)?.type === 'FOLDER') return;
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
          <button 
            onClick={onToggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><span className="material-symbols-outlined">help</span></button>
          <div className="size-9 rounded-full border border-gray-200 dark:border-gray-700 bg-cover bg-center" style={{ backgroundImage: 'url(https://picsum.photos/100/100?random=1)' }}></div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white dark:bg-surface-dark border-r border-gray-200 dark:border-gray-800 flex-col hidden md:flex shrink-0">
          <div className="p-4 flex flex-col gap-6">
            <button className="flex items-center justify-center gap-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full py-2.5 px-4 shadow-sm hover:shadow-md transition-shadow">
              <span className="material-symbols-outlined text-primary">add</span>
              <span className="font-medium">New Upload</span>
            </button>
            <nav className="flex flex-col gap-1">
              <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider px-3 mb-1">Sources</h3>
              {[
                { icon: 'hard_drive', label: 'My Drive', active: true },
                { icon: 'group', label: 'Shared with me' },
                { icon: 'schedule', label: 'Recent' },
                { icon: 'star', label: 'Starred' },
              ].map((item, i) => (
                <button key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${item.active ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  <span className={`material-symbols-outlined ${item.active ? 'filled' : ''}`}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-auto px-3">
              <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Storage</h3>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: '82%' }}></div>
              </div>
              <p className="text-[10px] text-gray-500">12.5 GB of 15 GB used</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-background-light dark:bg-background-dark overflow-hidden">
          <div className="px-6 py-6 flex flex-col gap-6 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Select Archive to Extract</h1>
              <p className="text-sm text-gray-500">Choose a file from your Google Drive or upload from your computer.</p>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 overflow-hidden">
                <span className="hover:text-primary cursor-pointer">My Drive</span>
                <span className="material-symbols-outlined text-base">chevron_right</span>
                <span className="font-medium text-slate-900 dark:text-white">Backups</span>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 !text-lg">search</span>
                  <input 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                    placeholder="Search archives..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-6 pb-24 custom-scrollbar">
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
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
                          <span className="text-sm font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{file.size}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                          {file.type === 'FOLDER' ? 'Folder' : `${file.type} Archive`}
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
                        <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                        <p>No archives found matching "{searchQuery}"</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 p-4 px-6 md:px-10 flex items-center justify-between shadow-lg z-30">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-6 bg-primary rounded-full text-white text-[10px] font-bold">{selectedIds.size}</div>
              <span className="text-sm font-medium">file selected</span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => onFileSelect('1')}
                disabled={selectedIds.size === 0}
                className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50"
              >
                Extract Files <span className="material-symbols-outlined !text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DrivePicker;
