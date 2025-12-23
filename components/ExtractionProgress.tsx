// Declare gapi as a global constant
declare const gapi: any;

import React, { useState, useEffect } from 'react';
import JSZip from 'https://esm.sh/jszip';
import { ExtractionConfig } from './DestinationPicker';

interface ExtractionProgressProps {
  archiveId: string;
  config: ExtractionConfig;
  accessToken: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

const ExtractionProgress: React.FC<ExtractionProgressProps> = ({ archiveId, config, accessToken, onComplete, onCancel }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Starting extraction engine...');
  const [currentFile, setCurrentFile] = useState('Initializing...');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);

  useEffect(() => {
    const performExtraction = async () => {
      if (!accessToken || !archiveId || !config) return;

      try {
        // 1. Tải file ZIP
        setStatus('Downloading archive...');
        const zipResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${archiveId}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const zipBlob = await zipResponse.blob();
        setProgress(20);

        // 2. Load ZIP
        setStatus('Scanning contents...');
        const zip = await JSZip.loadAsync(zipBlob);
        const files = Object.keys(zip.files).filter(path => !zip.files[path].dir);
        const totalFiles = files.length;
        setProgress(30);

        // 3. Tạo subfolder nếu được yêu cầu
        let targetFolderId = config.destinationFolderId;
        if (config.createSubfolder) {
          setStatus('Creating subfolder...');
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

        // 4. Giải nén và Upload từng file
        setStatus('Extracting & Uploading...');
        for (let i = 0; i < totalFiles; i++) {
          const path = files[i];
          setCurrentFile(path);
          
          // Lấy nội dung file
          const zipFile = zip.files[path];
          const content = await zipFile.async('blob');
          
          // Chuẩn bị metadata cho Drive
          const fileName = path.split('/').pop() || 'unnamed';
          
          // Để thực hiện upload nội dung thực tế một cách chính xác, 
          // chúng ta sử dụng fetch thay vì gapi client cho multipart upload đơn giản hơn
          const metadata = {
            name: fileName,
            parents: [targetFolderId]
          };

          const formData = new FormData();
          formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          formData.append('file', content);

          await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData
          });

          const currentProgress = 30 + ((i + 1) / totalFiles) * 70;
          setProgress(currentProgress);
        }

        setIsSuccess(true);
      } catch (error: any) {
        console.error('Extraction failed:', error);
        setIsError(error.message || 'An unknown error occurred during extraction.');
      }
    };

    performExtraction();
  }, [archiveId, config, accessToken]);

  if (isError) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-2xl p-8 text-center border border-red-100">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
          <h2 className="text-xl font-bold mb-2">Extraction Failed</h2>
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
          <div className="size-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl filled animate-bounce">check_circle</span>
          </div>
          <h2 className="text-2xl font-black mb-2">Extraction Success!</h2>
          <p className="text-gray-500 mb-8">All files from the archive have been moved to your Google Drive destination.</p>
          <button 
            onClick={onComplete}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-500/20"
          >
            Finish & Return
          </button>
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
                <h2 className="font-black text-lg">Unzipping...</h2>
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
                <div 
                  className="h-full bg-primary transition-all duration-300 shadow-blue-500/50 shadow-md"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex items-center gap-4 border border-gray-100 dark:border-gray-700">
              <span className="material-symbols-outlined text-primary/60">insert_drive_file</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{currentFile}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Processing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtractionProgress;
