
// Declare fflate and gapi as global constants
declare const fflate: any;
declare const gapi: any;

import React, { useState, useEffect } from 'react';
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
  const [status, setStatus] = useState('Đang khởi động...');
  const [currentFile, setCurrentFile] = useState('Đang chuẩn bị...');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const performExtraction = async () => {
      if (!accessToken || !archiveId || !config) return;

      try {
        if (isMounted) setStatus('Đang tải tệp ZIP từ Drive...');
        const zipResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${archiveId}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!zipResponse.ok) throw new Error(`Lỗi tải file`);
        const arrayBuffer = await zipResponse.arrayBuffer();
        if (isMounted) setProgress(15);

        if (isMounted) setStatus('Đang giải nén dữ liệu...');
        const uint8 = new Uint8Array(arrayBuffer);
        
        // Giải nén toàn bộ bằng fflate
        const unzipped = fflate.unzipSync(uint8);
        const filePaths = Object.keys(unzipped);
        const totalFiles = filePaths.length;
        if (isMounted) setProgress(30);

        // Tạo thư mục gốc nếu cần
        let targetFolderId = config.destinationFolderId;
        if (config.createSubfolder) {
          if (isMounted) setStatus('Đang tạo thư mục mới...');
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

        if (isMounted) setStatus('Đang đồng bộ lên Drive...');
        
        for (let i = 0; i < totalFiles; i++) {
            if (!isMounted) break;
            const path = filePaths[i];
            const data = unzipped[path];
            
            // Bỏ qua thư mục rỗng (path kết thúc bằng /)
            if (path.endsWith('/')) continue;

            const nameParts = path.split('/');
            const fileName = nameParts.pop() || 'file';
            setCurrentFile(path);

            // Chuyển Uint8Array thành Blob để upload
            const fileBlob = new Blob([data]);
            
            // Drive Upload
            const metadata = { name: fileName, parents: [targetFolderId] };
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            formData.append('file', fileBlob);

            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
              body: formData
            });

            if (isMounted) {
              const currentProgress = 30 + Math.round(((i + 1) / totalFiles) * 70);
              setProgress(currentProgress);
            }
        }

        if (isMounted) {
            setProgress(100);
            setIsSuccess(true);
        }
      } catch (error: any) {
        console.error('Extraction Error:', error);
        if (isMounted) setIsError('Quá trình giải nén hoặc tải lên thất bại. Vui lòng kiểm tra dung lượng Drive.');
      }
    };

    performExtraction();
    return () => { isMounted = false; };
  }, [archiveId, config, accessToken]);

  if (isError) {
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl p-10 text-center shadow-2xl">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
          <h2 className="text-2xl font-black mb-3">Lỗi thao tác</h2>
          <p className="text-sm text-gray-500 mb-10 leading-relaxed">{isError}</p>
          <button onClick={onCancel} className="w-full py-4 bg-primary text-white rounded-2xl font-black">Thử lại</button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl p-10 text-center shadow-2xl">
          <span className="material-symbols-outlined text-green-600 text-6xl mb-6 filled animate-bounce">check_circle</span>
          <h2 className="text-3xl font-black mb-3">Thành công!</h2>
          <p className="text-gray-500 mb-12">Tệp tin đã được giải nén thành công vào Google Drive của bạn.</p>
          <button onClick={onComplete} className="w-full py-4 bg-primary text-white rounded-2xl font-black">Quay lại trình duyệt</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="w-full max-w-xl bg-white dark:bg-surface-dark rounded-[2.5rem] shadow-2xl overflow-hidden p-12">
        <div className="flex items-center gap-6 mb-16">
          <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined filled animate-spin text-4xl">sync</span>
          </div>
          <div>
            <h2 className="font-black text-3xl">Đang giải nén</h2>
            <p className="text-xs text-primary font-black uppercase tracking-widest mt-1">Tiến độ: {progress}%</p>
          </div>
        </div>
        
        <div className="space-y-12">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{status}</p>
            <div className="w-full h-6 bg-gray-100 dark:bg-gray-800 rounded-full p-2">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-3xl p-8 flex items-center gap-8 border border-gray-100 dark:border-white/5">
            <span className="material-symbols-outlined text-3xl text-primary/60">description</span>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Đang xử lý</p>
              <p className="text-base font-black truncate">{currentFile}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtractionProgress;
