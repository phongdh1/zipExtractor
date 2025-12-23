
import React, { useState, useMemo } from 'react';
import { ArchiveContent } from '../types';

interface ArchivePreviewProps {
  archiveId: string;
  onExtract: () => void;
  onBack: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

const ArchivePreview: React.FC<ArchivePreviewProps> = ({ archiveId, onExtract, onBack, darkMode, onToggleTheme }) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(['2', '4', '5']));
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1']));
  const [filterQuery, setFilterQuery] = useState('');

  const items: ArchiveContent[] = [
    { id: '1', name: 'images/', size: '--', dateModified: 'Oct 24, 2023', type: 'folder' },
    { id: '2', name: 'logo.png', size: '24 KB', dateModified: 'Oct 24, 2023', type: 'image', parentId: '1' },
    { id: '3', name: 'banner.jpg', size: '1.2 MB', dateModified: 'Oct 22, 2023', type: 'image', parentId: '1' },
    { id: '4', name: 'design_specs.docx', size: '845 KB', dateModified: 'Oct 22, 2023', type: 'doc', parentId: '1' },
    { id: '5', name: 'report.pdf', size: '450 KB', dateModified: 'Oct 20, 2023', type: 'pdf' },
    { id: '6', name: 'source_code/', size: '--', dateModified: 'Oct 18, 2023', type: 'folder' },
    { id: '7', name: 'readme.md', size: '2 KB', dateModified: 'Oct 15, 2023', type: 'text' },
  ];

  const filteredItems = useMemo(() => {
    return items.filter(i => i.name.toLowerCase().includes(filterQuery.toLowerCase()));
  }, [filterQuery, items]);

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedFolders(newExpanded);
  };

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'folder': return { icon: 'folder', color: 'text-gray-400' };
      case 'image': return { icon: 'image', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' };
      case 'doc': return { icon: 'description', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' };
      case 'pdf': return { icon: 'picture_as_pdf', color: 'text-red-500 bg-red-100 dark:bg-red-900/30' };
      default: return { icon: 'text_snippet', color: 'text-gray-400 bg-gray-100 dark:bg-gray-800' };
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark px-6 py-3 shrink-0 z-10">
        <div className="flex items-center gap-4 cursor-pointer" onClick={onBack}>
          <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg text-primary">
            <span className="material-symbols-outlined text-lg filled">folder_zip</span>
          </div>
          <h2 className="text-lg font-bold">ZIP Extractor</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <div className="size-9 rounded-full border border-gray-200 bg-cover" style={{ backgroundImage: 'url(https://picsum.photos/100/100?random=2)' }}></div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto w-full p-6 pb-32">
            <nav className="flex items-center gap-2 mb-4 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1 hover:text-primary cursor-pointer"><span className="material-symbols-outlined !text-base">cloud</span> My Drive</span>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-bold">{archiveId}</span>
            </nav>

            <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{archiveId}</h1>
                <div className="flex items-center gap-3 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <span>~{items.length} Files</span>
                  <span className="text-gray-300">•</span>
                  <span>Created Oct 24, 2023</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-t-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined !text-lg">search</span>
                <input 
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm" 
                  placeholder="Filter files by name..." 
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-b-xl border-x border-b border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="w-12 px-4 py-3"></th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 w-32">Size</th>
                    <th className="px-4 py-3 w-40">Date Modified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredItems.map(item => {
                    const isExpanded = expandedFolders.has(item.id);
                    const isVisible = filterQuery.length > 0 || !item.parentId || expandedFolders.has(item.parentId);
                    const iconData = getIcon(item.type);
                    
                    if (!isVisible) return null;

                    return (
                      <tr key={item.id} className={`group hover:bg-primary/5 transition-colors cursor-pointer ${selectedItems.has(item.id) ? 'bg-primary/5' : ''}`}>
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            checked={selectedItems.has(item.id)} 
                            onChange={() => toggleItem(item.id)}
                            className="rounded text-primary" 
                          />
                        </td>
                        <td className="px-4 py-3" onClick={() => item.type === 'folder' ? toggleFolder(item.id) : toggleItem(item.id)}>
                          <div className={`flex items-center gap-2 select-none ${(item.parentId && !filterQuery) ? 'pl-8' : ''}`}>
                            {item.type === 'folder' && !filterQuery && (
                              <span className={`material-symbols-outlined text-gray-400 !text-lg transition-transform ${isExpanded ? 'rotate-90' : ''}`}>arrow_right</span>
                            )}
                            <div className={`size-8 rounded flex items-center justify-center shrink-0 ${iconData.color}`}>
                              <span className="material-symbols-outlined !text-lg">{isExpanded ? 'folder_open' : iconData.icon}</span>
                            </div>
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.size}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.dateModified}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark p-4 shadow-xl z-30">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm font-black">{selectedItems.size} items selected</p>
            </div>
            <button 
              onClick={onExtract}
              className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-bold shadow-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <span className="material-symbols-outlined !text-lg">add_to_drive</span> Extract to Drive
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArchivePreview;
