
// Declare gapi as global constant
declare const gapi: any;

import React, { useState, useEffect, useMemo } from 'react';
import { extractArchive } from '../utils/archiveExtractor';
import { ArchiveContent } from '../types';

interface ArchivePreviewProps {
  archiveId: string;
  onExtract: (fileName: string) => void;
  onBack: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  accessToken: string | null;
}

interface TreeNode {
  id: string; // Full path
  name: string;
  isFolder: boolean;
  children: TreeNode[];
  data?: ArchiveContent;
}

const ArchivePreview: React.FC<ArchivePreviewProps> = ({ archiveId, onExtract, onBack, darkMode, onToggleTheme, accessToken }) => {
  const [treeRoot, setTreeRoot] = useState<TreeNode | null>(null);
  const [fileName, setFileName] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [filterQuery, setFilterQuery] = useState('');

  const buildTree = (unzipped: Record<string, Uint8Array>) => {
    const root: TreeNode = { id: '', name: 'root', isFolder: true, children: [] };
    
    Object.keys(unzipped).forEach(path => {
      const parts = path.split('/').filter(p => p !== '');
      let currentNode = root;
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath += (currentPath ? '/' : '') + part;
        const isLast = index === parts.length - 1;
        const isFolder = !isLast || path.endsWith('/');
        
        let existingChild = currentNode.children.find(child => child.name === part);
        
        if (!existingChild) {
          const newNode: TreeNode = {
            id: currentPath + (isFolder ? '/' : ''),
            name: part,
            isFolder: isFolder,
            children: []
          };
          
          if (!isFolder || isLast) {
             const size = unzipped[path].length;
             newNode.data = {
               id: path,
               name: part,
               size: isFolder ? '--' : (size > 1024 * 1024 ? (size / (1024 * 1024)).toFixed(1) + ' MB' : (size / 1024).toFixed(1) + ' KB'),
               dateModified: new Date().toLocaleDateString(),
               type: isFolder ? 'folder' : getFileType(part)
             };
          }
          
          currentNode.children.push(newNode);
          existingChild = newNode;
        }
        
        currentNode = existingChild;
      });
    });

    // Sort folders first
    const sortTree = (node: TreeNode) => {
      node.children.sort((a, b) => {
        if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
        return a.isFolder ? -1 : 1;
      });
      node.children.forEach(sortTree);
    };
    sortTree(root);
    
    return root;
  };

  const getFileType = (name: string): any => {
    const lower = name.toLowerCase();
    if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (lower.endsWith('.pdf')) return 'pdf';
    if (lower.match(/\.(doc|docx|txt|rtf|odt)$/)) return 'doc';
    return 'text';
  };

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

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${archiveId}?alt=media&supportsAllDrives=true`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error(`Download failed`);
        const arrayBuffer = await response.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);

        try {
          // Use the archive extractor utility which handles both ZIP and 7z formats
          const unzipped = await extractArchive(uint8, fileName);
          
          const root = buildTree(unzipped);
          
          if (isMounted) {
            setTreeRoot(root);
            // Default select all
            const allPaths = new Set<string>();
            const traverse = (node: TreeNode) => {
              if (node.id) allPaths.add(node.id);
              node.children.forEach(traverse);
            };
            traverse(root);
            setSelectedPaths(allPaths);
            
            // Auto expand first level
            setExpandedPaths(new Set(root.children.filter(c => c.isFolder).map(c => c.id)));
          }
        } catch (unzipErr: any) {
          console.error('Extraction error:', unzipErr);
          throw new Error(`Failed to extract archive: ${unzipErr?.message || 'Unsupported archive format or corrupted file.'}`);
        }
      } catch (err: any) {
        console.error('Extraction Error:', err);
        if (isMounted) setError(err.message || 'Could not read archive file.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadArchive();
    return () => { isMounted = false; };
  }, [archiveId, accessToken]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedPaths(newExpanded);
  };

  const togglePathSelection = (node: TreeNode) => {
    const newSelected = new Set(selectedPaths);
    const isCurrentlySelected = selectedPaths.has(node.id);
    
    const traverse = (n: TreeNode, select: boolean) => {
      if (select) newSelected.add(n.id);
      else newSelected.delete(n.id);
      n.children.forEach(c => traverse(c, select));
    };
    
    traverse(node, !isCurrentlySelected);
    setSelectedPaths(newSelected);
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    if (node.name === 'root') {
      return node.children.map(child => renderTreeNode(child, level));
    }

    if (filterQuery && !node.name.toLowerCase().includes(filterQuery.toLowerCase()) && !node.isFolder) {
      return null;
    }

    const isExpanded = expandedPaths.has(node.id);
    const isSelected = selectedPaths.has(node.id);
    const hasChildren = node.children.length > 0;

    const iconInfo = getIcon(node.isFolder ? 'folder' : (node.data?.type || 'text'));

    return (
      <div key={node.id}>
        <div 
          className={`group flex items-center py-2 px-4 hover:bg-primary/5 cursor-pointer transition-colors border-l-2 ${isSelected ? 'border-primary' : 'border-transparent'}`}
          style={{ paddingLeft: `${(level * 20) + 16}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => node.isFolder ? toggleExpand(node.id) : togglePathSelection(node)}>
            <div className="flex items-center justify-center w-6">
              {node.isFolder && (
                <span className="material-symbols-outlined !text-lg text-gray-400 group-hover:text-primary transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                  chevron_right
                </span>
              )}
            </div>
            
            <input 
              type="checkbox" 
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                togglePathSelection(node);
              }}
              className="rounded text-primary focus:ring-primary/20 mr-2" 
            />

            <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${iconInfo.color}`}>
              <span className="material-symbols-outlined !text-lg">{iconInfo.icon}</span>
            </div>
            
            <span className="text-sm font-bold text-slate-700 dark:text-zinc-200 truncate pr-4">
              {node.name}
            </span>
          </div>

          <div className="flex items-center gap-8 shrink-0 text-xs font-bold text-gray-400">
            <span className="w-20 uppercase">{node.isFolder ? '--' : node.data?.size}</span>
            <span className="w-32 text-right">{node.data?.dateModified || '--'}</span>
          </div>
        </div>
        
        {node.isFolder && isExpanded && (
          <div className="border-l border-gray-100 dark:border-gray-800 ml-8">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
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

  const totalFiles = useMemo(() => {
    let count = 0;
    const traverse = (node: TreeNode) => {
      if (!node.isFolder) count++;
      node.children.forEach(traverse);
    };
    if (treeRoot) traverse(treeRoot);
    return count;
  }, [treeRoot]);

  const selectedCount = useMemo(() => {
    let count = 0;
    const traverse = (node: TreeNode) => {
      if (!node.isFolder && selectedPaths.has(node.id)) count++;
      node.children.forEach(traverse);
    };
    if (treeRoot) traverse(treeRoot);
    return count;
  }, [treeRoot, selectedPaths]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background-light dark:bg-background-dark font-sans">
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark px-6 py-3 shrink-0 z-10 shadow-sm">
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
          <div className="size-9 rounded-full border border-gray-200 dark:border-gray-700 bg-cover bg-center shadow-sm" style={{ backgroundImage: 'url(https://api.dicebear.com/7.x/avataaars/svg?seed=Felix)' }}></div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto w-full p-6 pb-32">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6">
                <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-900 dark:text-white font-black text-lg">Reading archive data...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                <div className="size-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-5xl">warning</span>
                </div>
                <div className="max-w-md">
                   <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Notification</h3>
                   <p className="text-gray-500 text-sm mb-8 leading-relaxed">{error}</p>
                   <button onClick={onBack} className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">Go Back</button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{fileName}</h1>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">{totalFiles} total files</p>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                    <div className="relative flex-1 max-w-md">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined !text-lg">search</span>
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                        placeholder="Search in archive..." 
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-8 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">
                      <span className="w-20">Size</span>
                      <span className="w-32 text-right">Modified</span>
                    </div>
                  </div>

                  <div className="py-2">
                    {treeRoot && renderTreeNode(treeRoot)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {!error && !isLoading && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl p-5 z-30 shadow-2xl">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-11 bg-primary rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-primary/30">
                    {selectedCount}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Files Selected</p>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Ready to transfer to Drive</p>
                </div>
              </div>
              <button 
                disabled={selectedCount === 0}
                onClick={() => onExtract(fileName)}
                className="px-10 py-4 rounded-2xl bg-primary text-white text-sm font-black shadow-xl shadow-primary/30 hover:bg-blue-600 disabled:opacity-40 transition-all active:scale-95 flex items-center gap-2"
              >
                Continue to Extract <span className="material-symbols-outlined !text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArchivePreview;
