
// Declare gapi and Archive as global constants
declare const gapi: any;
declare const Archive: any;

import React, { useState, useEffect, useMemo } from 'react';
import { ArchiveContent } from '../types';

// Use a stable CDN for the worker bundle
const WORKER_BUNDLE_URL = 'https://cdn.jsdelivr.net/npm/libarchive.js@1.3.0/dist/worker-bundle.js';

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
    let workerUrl: string | null = null;
    let isMounted = true;

    const loadArchive = async () => {
      if (!accessToken || !archiveId) return;
      setIsLoading(true);
      setError(null);
      
      try {
        const metadata = await gapi.client.drive.files.get({
          fileId: archiveId,
          fields: 'name, size, mimeType'
        });
        if (isMounted) setFileName(metadata.result.name);

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${archiveId}?alt=media`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error(`Download failed: ${response.status}`);
        const blob = await response.blob();

        if (typeof Archive === 'undefined') {
          throw new Error('LibArchive engine could not be detected. Please check your internet connection.');
        }

        /**
         * FIX: Instead of importScripts, we fetch the actual bundle code.
         * This prevents the "Module scripts don't support importScripts()" error.
         */
        const workerResponse = await fetch(WORKER_BUNDLE_URL);
        if (!workerResponse.ok) throw new Error('Failed to fetch compression engine bundle.');
        const workerCode = await workerResponse.text();
        
        const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
        workerUrl = URL.createObjectURL(workerBlob);

        Archive.init({ workerUrl: workerUrl });

        const archiveInstance = await Archive.open(blob);
        const obj = await archiveInstance.getFilesObject();
        
        const archiveItems: ArchiveContent[] = [];
        
        const processNode = (node: any, path: string = '') => {
            Object.keys(node).forEach(key => {
                const item = node[key];
                if (key === '_isDir' || key === 'entries' || key === 'size') return;
                
                const currentPath = path ? `${path}/${key}` : key;
                const isDir = item._isDir === true;
                
                let fileType: any = isDir ? 'folder' : 'text';
                const lowerKey = key.toLowerCase();
                if (lowerKey.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) fileType = 'image';
                else if (lowerKey.endsWith('.pdf')) fileType = 'pdf';
                else if (lowerKey.match(/\.(doc|docx|txt|rtf|odt)$/)) fileType = 'doc';
                else if (lowerKey.match(/\.(zip|rar|7z|tar|gz|bz2)$/)) fileType = 'archive';

                archiveItems.push({
                    id: currentPath,
                    name: key,
                    size: isDir ? '--' : (item.size > 1024 * 1024 ? (item.size / (1024 * 1024)).toFixed(1) + ' MB' : (item.size / 1024).toFixed(1) + ' KB'),
                    dateModified: new Date().toLocaleDateString(),
                    type: fileType
                });

                if (isDir && item.entries) {
                    processNode(item.entries, currentPath);
                }
            });
        };

        processNode(obj);

        if (isMounted) {
          if (archiveItems.length === 0) throw new Error('Archive is empty or uses an unsupported encoding.');
          setItems(archiveItems);
          setSelectedItems(new Set(archiveItems.map(i => i.id)));
        }
      } catch (err: any) {
        console.error('Archive Error:', err);
        if (isMounted) {
          setError(err.message || 'Error parsing archive content. Ensure the file is not corrupted.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadArchive();

    return () => {
      isMounted = false;
      if (workerUrl) URL.revokeObjectURL(workerUrl);
    };
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
      case 'folder': return { icon: 'folder', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' };
      case 'image': return { icon: 'image', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' };
      case 'pdf': return { icon: 'picture_as_pdf', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
      case 'doc': return { icon: 'description', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
      case 'archive': return { icon: 'inventory_2', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' };
      default: return { icon: 'draft', color: 'text-slate-400 bg-slate-50 dark:bg-slate-800' };
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark px-6 py-3 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer" onClick={onBack}>
          <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg text-primary">
            <span className="material-symbols-outlined text-lg filled">arrow_back</span>
          </div>
          <h2 className="text-lg font-bold">Back to Explorer</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <div className="size-9 rounded-full border border-gray-200 dark:border-gray-700 bg-cover bg-center shadow-sm" style={{ backgroundImage: 'url(https://api.dicebear.com/7.x/avataaars/svg?seed=Felix)' }}></div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto w-full p-6 pb-32">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6">
                <div className="relative">
                  <div className="size-16 border-4 border-primary/20 rounded-full"></div>
                  <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0"></div>
                </div>
                <div className="text-center">
                  <p className="text-slate-900 dark:text-white font-black text-lg">WASM Engine Initializing...</p>
                  <p className="text-gray-500 text-sm font-medium mt-1">Downloading core components for {fileName}</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                <div className="size-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center shadow-xl shadow-red-500/10">
                  <span className="material-symbols-outlined text-5xl">warning</span>
                </div>
                <div className="max-w-md">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Extraction Error</h3>
                  <p className="text-gray-500 mb-8 leading-relaxed">{error}</p>
                  <button onClick={onBack} className="px-8 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/30 hover:bg-blue-600 transition-all active:scale-95">Go Back</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1 mb-8">
                  <nav className="flex items-center gap-2 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors" onClick={onBack}>
                      <span className="material-symbols-outlined !text-sm">cloud</span> Drive
                    </span>
                    <span className="opacity-30">/</span>
                    <span className="text-slate-900 dark:text-white truncate max-w-[200px]">{fileName}</span>
                  </nav>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{fileName}</h1>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{items.length} Elements detected inside</p>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-surface-dark z-10">
                    <div className="relative flex-1 max-w-md">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined !text-lg">search</span>
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all" 
                        placeholder="Search inside archive..." 
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <th className="w-14 px-4 py-4 text-center">
                             <input 
                               type="checkbox" 
                               checked={selectedItems.size === items.length && items.length > 0} 
                               onChange={() => setSelectedItems(selectedItems.size === items.length ? new Set() : new Set(items.map(i => i.id)))} 
                               className="rounded text-primary focus:ring-primary/20 transition-all" 
                             />
                          </th>
                          <th className="px-4 py-4">Name</th>
                          <th className="px-4 py-4 w-32">Size</th>
                          <th className="px-4 py-4 w-40">Modified</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {filteredItems.map(item => (
                          <tr key={item.id} className={`group hover:bg-primary/5 transition-colors cursor-pointer ${selectedItems.has(item.id) ? 'bg-primary/5' : ''}`}>
                            <td className="px-4 py-4 text-center">
                              <input 
                                type="checkbox" 
                                checked={selectedItems.has(item.id)} 
                                onChange={() => toggleItem(item.id)}
                                className="rounded text-primary focus:ring-primary/20 transition-all" 
                              />
                            </td>
                            <td className="px-4 py-4" onClick={() => toggleItem(item.id)}>
                              <div className="flex items-center gap-3 select-none">
                                <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${getIcon(item.type).color}`}>
                                  <span className="material-symbols-outlined !text-xl">{getIcon(item.type).icon}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-zinc-200 truncate max-w-[400px]">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-xs font-black text-gray-400 uppercase">{item.size}</td>
                            <td className="px-4 py-4 text-xs font-bold text-gray-400">{item.dateModified}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {!error && !isLoading && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-11 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
                    <span className="font-black text-base">{selectedItems.size}</span>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-black text-slate-900 dark:text-white">Ready for Extraction</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Targeting Google Drive</p>
                </div>
              </div>
              <button 
                disabled={selectedItems.size === 0}
                onClick={() => onExtract(fileName)}
                className="px-10 py-4 rounded-2xl bg-primary text-white text-sm font-black shadow-2xl shadow-primary/40 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3"
              >
                <span className="material-symbols-outlined !text-lg">unarchive</span> Extract All
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArchivePreview;
