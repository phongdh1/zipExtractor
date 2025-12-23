
import React, { useState } from 'react';

interface DestinationPickerProps {
  onCancel: () => void;
  onConfirm: () => void;
}

const DestinationPicker: React.FC<DestinationPickerProps> = ({ onCancel, onConfirm }) => {
  const [selectedFolder, setSelectedFolder] = useState('Campaign Assets 2024');

  const folders = [
    { name: 'Q1 Deliverables', icon: 'folder', type: 'standard' },
    { name: 'Campaign Assets 2024', icon: 'folder_open', type: 'selected' },
    { name: 'Legal Docs', icon: 'folder', type: 'standard' },
    { name: 'External Partners', icon: 'folder_shared', type: 'shared' },
    { name: 'Archive', icon: 'folder', type: 'standard' },
    { name: 'Screenshots', icon: 'folder', type: 'standard' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="w-full max-w-4xl bg-white dark:bg-surface-dark rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 h-[80vh]">
        
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black tracking-tight">Extract to...</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-gray-400 !text-lg">folder_zip</span>
              <p className="text-gray-500 text-sm">Source: <span className="font-bold text-slate-900 dark:text-gray-200">project-backup-2023.zip</span></p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Select Destination</h3>
              <button className="flex items-center gap-1 text-primary hover:text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/10">
                <span className="material-symbols-outlined !text-lg">create_new_folder</span> New Folder
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined !text-lg">search</span>
                <input className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm" placeholder="Filter folders" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-400 overflow-x-auto py-1 whitespace-nowrap scrollbar-hide">
                <span className="hover:text-primary cursor-pointer">My Drive</span>
                <span className="material-symbols-outlined !text-sm">chevron_right</span>
                <span className="hover:text-primary cursor-pointer">Projects</span>
                <span className="material-symbols-outlined !text-sm">chevron_right</span>
                <span className="text-slate-900 dark:text-white">Active Client Work</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-400">
                  <span className="material-symbols-outlined">arrow_upward</span>
                  <span className="text-sm font-bold">..</span>
                </div>
                {folders.map((folder, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedFolder(folder.name)}
                    className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${selectedFolder === folder.name ? 'bg-primary/10 border border-primary/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`material-symbols-outlined filled ${selectedFolder === folder.name ? 'text-primary' : 'text-gray-400'}`}>{folder.icon}</span>
                      <span className={`text-sm font-medium truncate ${selectedFolder === folder.name ? 'text-primary' : ''}`}>{folder.name}</span>
                    </div>
                    {selectedFolder === folder.name ? (
                      <span className="material-symbols-outlined text-primary !text-lg">check</span>
                    ) : (
                      <span className="material-symbols-outlined text-gray-300 !text-lg">chevron_right</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full md:w-[320px] bg-gray-50 dark:bg-gray-900/50 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Extraction Options</h3>
              <label className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary/50 transition-colors">
                <input type="checkbox" defaultChecked className="mt-1 rounded text-primary focus:ring-primary/20" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Create new folder</span>
                  <span className="text-[10px] text-gray-500 font-medium leading-tight mt-1 uppercase tracking-wide">Creates "project-backup" inside the selected destination.</span>
                </div>
              </label>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-800 w-full"></div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Conflict Resolution</h3>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-4">What if a file already exists?</p>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'keep', label: 'Rename (Keep both)', active: true },
                  { id: 'overwrite', label: 'Overwrite existing' },
                  { id: 'skip', label: 'Skip files' }
                ].map((opt) => (
                  <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${opt.active ? 'bg-white dark:bg-gray-800 border-primary shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:bg-white'}`}>
                    <input type="radio" name="conflict" defaultChecked={opt.active} className="text-primary focus:ring-primary/20" />
                    <span className="text-xs font-bold">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-auto bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3 items-start border border-blue-100 dark:border-blue-900/30">
              <span className="material-symbols-outlined text-primary !text-lg mt-0.5">info</span>
              <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider leading-relaxed">
                You have "Editor" access to <strong>{selectedFolder}</strong>. Files will be extracted immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end items-center gap-3 bg-white dark:bg-surface-dark">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
          <button 
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-lg text-sm font-bold bg-primary text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-lg">unarchive</span> Extract Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationPicker;
