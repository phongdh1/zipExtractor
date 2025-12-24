
// Declare gapi as global constant
declare const gapi: any;

import React, { useState, useEffect, useMemo } from 'react';
import * as fflate from 'fflate';
import { ArchiveContent } from '../types';

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
    let isMounted = true;

    const loadArchive = async () => {
      if (!accessToken || !archiveId) return;
      setIsLoading(true);
      setError(null);
      
      try {
        const metadata = await gapi.client.drive.files.get({
          fileId: archiveId,
          fields: 'name'
        });
        if (isMounted) setFileName(metadata.result.name);

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${archiveId}?alt=media`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error(`Download failed`);
        const arrayBuffer = await response.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);

        // fflate.unzipSync is used to get the file list
        const unzipped = fflate.unzipSync(uint8);
        
        const archiveItems: ArchiveContent[] = Object.keys(unzipped).map(path => {
            const parts = path.split('/');
            const name = parts.pop() || parts.pop() || 'Unnamed';
            const isDir = path.endsWith('/');
            const size = unzipped[path].length;

            let fileType: any = isDir ? 'folder' : 'text';
            const lowerKey = name.toLowerCase();
            if (lowerKey.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) fileType = 'image';
            else if (lowerKey.endsWith('.pdf')) fileType = 'pdf';
            else if (lowerKey.match(/\.(doc|docx|txt|rtf|odt)$/)) fileType = 'doc';

            return {
                id: path,
                name: name,
                size: isDir ? '--' : (size > 1024 * 1024 ? (size / (1024 * 1024)).toFixed(1) + ' MB' : (size / 1024).toFixed(1) + ' KB'),
                dateModified: new Date().toLocaleDateString(),
                type: fileType
            };
        });

        if (isMounted) {
          setItems(archiveItems);
          setSelectedItems(new Set(archiveItems.map(i => i.id)));
        }
      } catch (err: any) {
        console.error('fflate Error:', err);
        if (isMounted) setError('Không thể đọc file ZIP. Đảm bảo file không bị hỏng và là định dạng ZIP.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadArchive();
    return () => { isMounted = false; };
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
      default: return { icon: 'draft', color: 'text-slate-400 bg-slate-50 dark:bg-slate-800' };
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background-light dark:bg-background-dark font-sans">
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark px-6 py-3 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer" onClick={onBack}>
          <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg text-primary">
            <span className="material-symbols-outlined text-lg filled">arrow_back</span>
          </div>
          <h2 className="text-lg font-bold">Quay lại Drive</h2>
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
                <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-900 dark:text-white font-black text-lg">Đang đọc dữ liệu ZIP...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                <span className="material-symbols-outlined text-red-500 text-5xl">warning</span>
                <p className="text-gray-500 max-w-md">{error}</p>
                <button onClick={onBack} className="px-8 py-3 bg-primary text-white rounded-xl font-bold">Thử lại</button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white">{fileName}</h1>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{items.length} tệp tin</p>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined !text-lg">search</span>
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm outline-none" 
                        placeholder="Tìm trong tệp nén..." 
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <th className="w-14 px-4 py-4 text-center">
                             <input 
                               type="checkbox" 
                               checked={selectedItems.size === items.length} 
                               onChange={() => setSelectedItems(selectedItems.size === items.length ? new Set() : new Set(items.map(i => i.id)))} 
                               className="rounded text-primary" 
                             />
                          </th>
                          <th className="px-4 py-4">Tên tệp</th>
                          <th className="px-4 py-4 w-32">Dung lượng</th>
                          <th className="px-4 py-4 w-40">Ngày sửa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {filteredItems.map(item => (
                          <tr key={item.id} className="hover:bg-primary/5 transition-colors cursor-pointer">
                            <td className="px-4 py-4 text-center">
                              <input 
                                type="checkbox" 
                                checked={selectedItems.has(item.id)} 
                                onChange={() => toggleItem(item.id)}
                                className="rounded text-primary" 
                              />
                            </td>
                            <td className="px-4 py-4" onClick={() => toggleItem(item.id)}>
                              <div className="flex items-center gap-3">
                                <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${getIcon(item.type).color}`}>
                                  <span className="material-symbols-outlined !text-xl">{getIcon(item.type).icon}</span>
                                </div>
                                <span className="text-sm font-bold truncate max-w-[400px]">{item.name}</span>
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
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl p-5 z-30">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-11 bg-primary rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                    {selectedItems.size}
                </div>
                <div>
                  <p className="text-sm font-black">Tệp đã chọn</p>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Sẵn sàng chuyển sang Google Drive</p>
                </div>
              </div>
              <button 
                disabled={selectedItems.size === 0}
                onClick={() => onExtract(fileName)}
                className="px-10 py-4 rounded-2xl bg-primary text-white text-sm font-black shadow-xl shadow-primary/30 hover:bg-blue-600 disabled:opacity-40 transition-all active:scale-95"
              >
                Tiếp tục giải nén
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArchivePreview;
