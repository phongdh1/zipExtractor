
// Declare gapi and Archive as global constants
declare const gapi: any;
declare const Archive: any;

import React, { useState, useEffect } from 'react';
import { ExtractionConfig } from './DestinationPicker';

const WORKER_BUNDLE_URL = 'https://cdn.jsdelivr.net/npm/libarchive.js@1.3.0/dist/worker-bundle.js';

interface ExtractionProgressProps {
  archiveId: string;
  config: ExtractionConfig;
  accessToken: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

const ExtractionProgress: React.FC<ExtractionProgressProps> = ({ archiveId, config, accessToken, onComplete, onCancel }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Starting engine...');
  const [currentFile, setCurrentFile] = useState('Initializing...');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let workerUrl: string | null = null;

    const performExtraction = async () => {
      if (!accessToken || !archiveId || !config) return;

      try {
        if (isMounted) setStatus('Downloading source file...');
        const zipResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${archiveId}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!zipResponse.ok) throw new Error(`Download failed`);
        const blob = await zipResponse.blob();
        if (isMounted) setProgress(15);

        if (typeof Archive === 'undefined') {
          throw new Error('LibArchive engine could not be detected.');
        }

        // FIX: Fetch worker code as text and create blob to bypass module/importScripts issues
        const workerResponse = await fetch(WORKER_BUNDLE_URL);
        if (!workerResponse.ok) throw new Error('Failed to fetch compression engine.');
        const workerCode = await workerResponse.text();
        const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
        workerUrl = URL.createObjectURL(workerBlob);

        Archive.init({ workerUrl: workerUrl });

        if (isMounted) setStatus('Mounting archive...');
        const archiveInstance = await Archive.open(blob);
        if (isMounted) setProgress(25);

        // Target Folder Logic
        let targetFolderId = config.destinationFolderId;
        if (config.createSubfolder) {
          if (isMounted) setStatus('Organizing target path...');
          const meta = await gapi.client.drive.files.get({ fileId: archiveId, fields: 'name' });
          const subfolderName = meta.result.name.replace(/\.[^/.]+$/, "");
          
          const folderResponse = await gapi.client.drive.files.create({
            resource: {
              name: subfolderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [config.destinationFolderId]
            }
          });
          targetFolderId = folderResponse.result.id;
        }

        if (isMounted) setStatus('Syncing contents...');
        
        // Iterative extraction
        await archiveInstance.extract(async (entry: any) => {
            if (!isMounted) return;
            if (entry.isDir) return;

            const pathParts = entry.path.split('/');
            const fileName = pathParts.pop() || 'file';
            setCurrentFile(entry.path);

            const fileBlob = await entry.extract();
            
            // Sync to Drive
            const metadata = { name: fileName, parents: [targetFolderId] };
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            formData.append('file', fileBlob);

            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
              body: formData
            });

            if (isMounted) setProgress(prev => Math.min(prev + 2, 98));
        });

        if (isMounted) {
            setProgress(100);
            setIsSuccess(true);
        }
      } catch (error: any) {
        console.error('Extraction Error:', error);
        if (isMounted) setIsError(error.message || 'Error occurred during extraction.');
      }
    };

    performExtraction();
    return () => { 
      isMounted = false; 
      if (workerUrl) URL.revokeObjectURL(workerUrl);
    };
  }, [archiveId, config, accessToken]);

  if (isError) {
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl p-10 text-center border border-red-100 dark:border-red-900/30 shadow-2xl">
          <div className="size-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-red-200">
            <span className="material-symbols-outlined text-5xl">error</span>
          </div>
          <h2 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">Operation Failed</h2>
          <p className="text-sm text-gray-500 mb-10 leading-relaxed">{isError}</p>
          <button onClick={onCancel} className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-2xl shadow-primary/30 transition-all active:scale-95">Go Back</button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl shadow-2xl p-10 flex flex-col items-center text-center">
          <div className="size-28 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mb-10 shadow-inner">
            <span className="material-symbols-outlined text-6xl filled animate-bounce">check_circle</span>
          </div>
          <h2 className="text-3xl font-black mb-3 text-slate-900 dark:text-white">Success!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-12 leading-relaxed">Your archive was successfully expanded and synced to your Google Drive.</p>
          <button onClick={onComplete} className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-2xl shadow-primary/40 transition-all active:scale-95">Return to Explorer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="w-full max-w-xl bg-white dark:bg-surface-dark rounded-[2.5rem] shadow-[0_32px_120px_rgba(0,0,0,0.3)] overflow-hidden border border-white/10">
        <div className="p-12">
          <div className="flex justify-between items-start mb-16">
            <div className="flex items-center gap-6">
              <div className="size-16 bg-primary/10 text-primary rounded-[1.25rem] flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined filled animate-spin text-4xl">sync</span>
              </div>
              <div className="flex flex-col">
                <h2 className="font-black text-3xl text-slate-900 dark:text-white tracking-tight">Syncing Files</h2>
                <span className="text-xs text-primary font-black uppercase tracking-[0.2em] mt-1">{Math.round(progress)}% Progress</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-12">
            <div>
              <div className="flex justify-between mb-5 px-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{status}</span>
              </div>
              <div className="w-full h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-2 shadow-inner">
                <div className="h-full bg-primary rounded-full transition-all duration-700 shadow-[0_0_20px_rgba(19,127,236,0.5)]" style={{ width: `${progress}%` }} />
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-3xl p-8 flex items-center gap-8 border border-gray-100 dark:border-white/5">
              <div className="size-14 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-md text-primary/60">
                <span className="material-symbols-outlined text-3xl">inventory_2</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Processing Entry</p>
                <p className="text-base font-black text-slate-700 dark:text-zinc-200 truncate">{currentFile || 'Awaiting task...'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtractionProgress;
