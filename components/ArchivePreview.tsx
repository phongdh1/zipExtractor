
// Declare gapi as a global constant
declare const gapi: any;

import React, { useState, useEffect, useMemo } from 'react';
import { ArchiveContent } from '../types';

// Load LibArchive.js from ESM
// Note: In a production environment, you would want to host the WASM files yourself.
const LIBARCHIVE_URL = 'https://esm.sh/libarchive.js';

interface ArchivePreviewProps {
  archiveId: string;
  onExtract: (fileName: string) => void;
  onBack: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  accessToken: string | null;
}

const ArchivePreview: React.FC<ArchivePreviewProps> = ({ archiveId, onExtract, onBack, darkMode, onToggleTheme, accessToken }) => {
  const [items, setItems] = useState<ArchiveContent[]>([]);
  const [fileName, setFileName] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    const loadArchive = async () => {
      if (!accessToken || !archiveId) return;
      setIsLoading(true);
      setError(null);
      
      try {
        const metadata = await gapi.client.drive.files.get({
          fileId: archiveId,
          fields: 'name, size, mimeType'
        });
        setFileName(metadata.result.name);

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${archiveId}?alt=media`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error(`Download failed: ${response.status}`);
        const blob = await response.blob();

        // Dynamically import libarchive.js and setup worker
        const { Archive } = await import(LIBARCHIVE_URL);
        
        // Setup worker from remote URL
        // In this environment, we use a hosted worker or initialize it with the correct paths
        Archive.init({
            workerUrl: 'https://cdn.jsdelivr.net/npm/libarchive.js/dist/worker-bundle.js'
        });

        const archive = await Archive.open(blob);
        const obj = await archive.getFilesObject();
        
        const archiveItems: ArchiveContent[] = [];
        
        const processNode = (node: any, path: string = '') => {
            Object.keys(node).forEach(key => {
                const item = node[key];
                const currentPath = path ? `${path}/${key}` : key;
                
                const isDir = item._isDir === true;
                
                archiveItems.push({
                    id: currentPath,
                    name: key,
                    size: isDir ? '--' : (item.size > 1024 * 1024 ? (item.size / (1024 * 1024)).toFixed(1) + ' MB' : (item.size / 1024).toFixed(1) + ' KB'),
                    dateModified: new Date().toLocaleDateString(), // Libarchive might not always expose dates easily per format
                    type: isDir ? 'folder' : (key.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' : key.endsWith('.pdf') ? 'pdf' : 'doc')
                });

                if (isDir && item.entries) {
                    processNode(item.entries, currentPath);
                }
            });
        };

        processNode(obj);

        if (archiveItems.length === 0) throw new Error('Archive is empty or unsupported format.');

        setItems(archiveItems);
        setSelectedItems(new Set(archiveItems.map(i => i.id)));
      } catch (err: any) {
        console.error('Archive Error:', err);
        setError(err.message || 'Could not read archive. Please ensure it is a valid .zip, .rar, or .7z file.');
      } finally {
        setIsLoading(false);
      }
    };

    loadArchive();
  }, [archiveId, accessToken]);

  const filteredItems = useMemo(() => {
    return items.filter(i => i.name.toLowerCase().includes(filterQuery.toLowerCase()));
  }, [filterQuery, items]);

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'folder': return { icon: 'folder', color: 'text-amber-400' };
      case 'image': return { icon: 'image', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' };
      case 'pdf': return { icon: 'picture_as_pdf', color: 'text-red-500 bg-red-100 dark:bg-red-900/30' };
      default: return { icon: 'description', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' };
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark px-6 py-3 shrink-0 z-10">
        <div className="flex items-center gap-4 cursor-pointer" onClick={onBack}>
          <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg text-primary">
            <span className="material-symbols-outlined text-lg filled">arrow_back</span>
          </div>
          <h2 className="text-lg font-bold">Back to Drive</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <div className="size-9 rounded-full border border-gray-200 bg-cover bg-center" style={{ backgroundImage: 'url(https://api.dicebear.com/7.x/avataaars/svg?seed=Felix)' }}></div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto w-full p-6 pb-32">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-bold animate-pulse">Analyzing multi-format archive (WASM)...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                <div className="size-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl">warning</span>
                </div>
                <div className="max-w-md">
                  <h3 className="text-xl font-bold mb-2">Unsupported Format</h3>
                  <p className="text-gray-500 mb-6">{error}</p>
                  <button onClick={onBack} className="px-6 py-2 bg-primary text-white rounded-lg font-bold">Try another file</button>
                </div>
              </div>
            ) : (
              <>
                <nav className="flex items-center gap-2 mb-4 text-xs font-medium text-gray-500">
                  <span className="flex items-center gap-1 hover:text-primary cursor-pointer" onClick={onBack}>
                    <span className="material-symbols-outlined !text-base">cloud</span> My Drive
                  </span>
                  <span>/</span>
                  <span className="text-slate-900 dark:text-white font-bold">{fileName}</span>
                </nav>

                <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{fileName}</h1>
                    <div className="flex items-center gap-3 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                      <span>{items.length} Files found</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-t-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                  <div className="relative flex-1 max-w-md">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined !text-lg">search</span>
                    <input 
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm" 
                      placeholder="Filter files..." 
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-b-xl border-x border-b border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="w-12 px-4 py-3 text-center">
                           <input 
                             type="checkbox" 
                             checked={selectedItems.size === items.length && items.length > 0} 
                             onChange={() => setSelectedItems(selectedItems.size === items.length ? new Set() : new Set(items.map(i => i.id)))} 
                             className="rounded text-primary" 
                           />
                        </th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 w-32">Size</th>
                        <th className="px-4 py-3 w-40">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredItems.map(item => (
                        <tr key={item.id} className={`group hover:bg-primary/5 transition-colors cursor-pointer ${selectedItems.has(item.id) ? 'bg-primary/5' : ''}`}>
                          <td className="px-4 py-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedItems.has(item.id)} 
                              onChange={() => toggleItem(item.id)}
                              className="rounded text-primary" 
                            />
                          </td>
                          <td className="px-4 py-3" onClick={() => toggleItem(item.id)}>
                            <div className="flex items-center gap-2 select-none">
                              <div className={`size-8 rounded flex items-center justify-center shrink-0 ${getIcon(item.type).color}`}>
                                <span className="material-symbols-outlined !text-lg">{getIcon(item.type).icon}</span>
                              </div>
                              <span className="text-sm font-medium">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.size}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.dateModified}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {!error && !isLoading && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md p-4 shadow-xl z-30">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm font-black">{selectedItems.size} files ready to extract</p>
              </div>
              <button 
                disabled={selectedItems.size === 0}
                onClick={() => onExtract(fileName)}
                className="px-8 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined !text-lg">unarchive</span> Extract All Files
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArchivePreview;
