
// Declare gapi as a global constant
declare const gapi: any;

import React, { useState, useEffect } from 'react';
import { ExtractionConfig } from './DestinationPicker';

const LIBARCHIVE_URL = 'https://esm.sh/libarchive.js';

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

    const performExtraction = async () => {
      if (!accessToken || !archiveId || !config) return;

      try {
        if (isMounted) setStatus('Downloading file...');
        const zipResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${archiveId}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!zipResponse.ok) throw new Error(`Download failed`);
        const blob = await zipResponse.blob();
        if (isMounted) setProgress(15);

        // Load LibArchive
        const { Archive } = await import(LIBARCHIVE_URL);
        Archive.init({
            workerUrl: 'https://cdn.jsdelivr.net/npm/libarchive.js/dist/worker-bundle.js'
        });

        if (isMounted) setStatus('Opening archive...');
        const archive = await Archive.open(blob);
        if (isMounted) setProgress(25);

        // Tạo folder đích
        let targetFolderId = config.destinationFolderId;
        if (config.createSubfolder) {
          if (isMounted) setStatus('Creating folder...');
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

        if (isMounted) setStatus('Extracting & Syncing...');
        
        // Sử dụng generator để lấy từng file nhằm tiết kiệm RAM
        let fileCount = 0;
        await archive.extract(async (entry: any) => {
            if (!isMounted) return;
            if (entry.isDir) return;

            fileCount++;
            const fileName = entry.path.split('/').pop() || 'file';
            setCurrentFile(entry.path);

            const fileBlob = await entry.extract();
            
            const metadata = { name: fileName, parents: [targetFolderId] };
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            formData.append('file', fileBlob);

            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
              body: formData
            });

            // Ước lượng progress (libarchive extraction progress hơi khó lấy chính xác từng file tuyệt đối)
            setProgress(prev => Math.min(prev + 2, 98));
        });

        if (isMounted) {
            setProgress(100);
            setIsSuccess(true);
        }
      } catch (error: any) {
        console.error('Extraction Error:', error);
        if (isMounted) setIsError(error.message || 'Error occurred');
      }
    };

    performExtraction();
    return () => { isMounted = false; };
  }, [archiveId, config, accessToken]);

  if (isError) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-2xl p-8 text-center border border-red-100 shadow-2xl">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
          <h2 className="text-xl font-bold mb-2">Failed</h2>
          <p className="text-sm text-gray-500 mb-6">{isError}</p>
          <button onClick={onCancel} className="w-full py-3 bg-primary text-white rounded-xl font-bold">Try Again</button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center">
          <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl filled animate-bounce">check_circle</span>
          </div>
          <h2 className="text-2xl font-black mb-2">Extracted!</h2>
          <p className="text-gray-500 mb-8">All files are now in your Drive.</p>
          <button onClick={onComplete} className="w-full py-4 bg-primary text-white rounded-xl font-bold">Return to Explorer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
      <div className="w-full max-w-lg bg-white dark:bg-surface-dark rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined filled animate-spin">sync</span>
              </div>
              <div>
                <h2 className="font-black text-lg">Extracting Multi-format...</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{Math.round(progress)}%</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{status}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300 shadow-blue-500/50 shadow-md" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex items-center gap-4">
              <span className="material-symbols-outlined text-primary/60">inventory_2</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{currentFile}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Processing entry</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtractionProgress;
