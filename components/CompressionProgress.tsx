
// Declare gapi and fflate as global constants
declare const gapi: any;

import React, { useState, useEffect } from 'react';
import * as fflate from 'fflate';

interface CompressionProgressProps {
  fileIds: string[];
  accessToken: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

const CompressionProgress: React.FC<CompressionProgressProps> = ({ fileIds, accessToken, onComplete, onCancel }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Đang khởi động...');
  const [currentFile, setCurrentFile] = useState('Đang chuẩn bị...');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const performCompression = async () => {
      if (!accessToken || fileIds.length === 0) return;

      try {
        const zipObject: Record<string, Uint8Array> = {};
        const total = fileIds.length;
        
        for (let i = 0; i < total; i++) {
          if (!isMounted) break;
          const id = fileIds[i];
          
          if (isMounted) setStatus(`Đang tải tệp ${i + 1}/${total}...`);
          
          const metaResponse = await gapi.client.drive.files.get({
            fileId: id,
            fields: 'name, mimeType'
          });
          const meta = metaResponse.result;
          
          if (meta.mimeType === 'application/vnd.google-apps.folder') {
             // For simplicity, we only handle flat files in this version.
             // Folder compression requires recursive listing.
             continue;
          }

          setCurrentFile(meta.name);

          const response = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (!response.ok) throw new Error(`Lỗi tải: ${meta.name}`);
          
          const buffer = await response.arrayBuffer();
          zipObject[meta.name] = new Uint8Array(buffer);
          
          if (isMounted) setProgress(Math.round(((i + 1) / total) * 60));
        }

        if (isMounted) setStatus('Đang thực hiện nén dữ liệu...');
        // fflate.zipSync creates a ZIP archive
        const zippedData = fflate.zipSync(zipObject, { level: 6 });
        if (isMounted) setProgress(80);

        if (isMounted) setStatus('Đang lưu tệp nén vào Drive...');
        const zipName = `Compressed_${new Date().getTime()}.zip`;
        const metadata = { name: zipName, mimeType: 'application/zip' };
        
        const boundary = "-------314159265358979323846";
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;
        
        const metadataPart = JSON.stringify(metadata);
        const header = delimiter + "Content-Type: application/json; charset=UTF-8\r\n\r\n" + metadataPart;
        const fileHeader = delimiter + "Content-Type: application/zip\r\n\r\n";
        
        const encoder = new TextEncoder();
        const headerBytes = encoder.encode(header);
        const fileHeaderBytes = encoder.encode(fileHeader);
        const closeBytes = encoder.encode(closeDelimiter);
        
        const totalSize = headerBytes.byteLength + fileHeaderBytes.byteLength + zippedData.byteLength + closeBytes.byteLength;
        const body = new Uint8Array(totalSize);
        
        let offset = 0;
        body.set(headerBytes, offset); offset += headerBytes.byteLength;
        body.set(fileHeaderBytes, offset); offset += fileHeaderBytes.byteLength;
        body.set(zippedData, offset); offset += zippedData.byteLength;
        body.set(closeBytes, offset);

        const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body
        });

        if (!uploadResponse.ok) throw new Error('Upload ZIP thất bại');

        if (isMounted) {
          setProgress(100);
          setIsSuccess(true);
        }
      } catch (error: any) {
        console.error('Compression Error:', error);
        if (isMounted) setIsError(error.message || 'Lỗi không xác định khi nén file.');
      }
    };

    performCompression();
    return () => { isMounted = false; };
  }, [fileIds, accessToken]);

  if (isError) {
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl p-10 text-center shadow-2xl">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
          <h2 className="text-2xl font-black mb-3">Lỗi thao tác</h2>
          <p className="text-sm text-gray-500 mb-10 leading-relaxed">{isError}</p>
          <button onClick={onCancel} className="w-full py-4 bg-primary text-white rounded-2xl font-black">Quay lại</button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl p-10 text-center shadow-2xl">
          <span className="material-symbols-outlined text-green-600 text-6xl mb-6 filled animate-bounce">check_circle</span>
          <h2 className="text-3xl font-black mb-3">Nén thành công!</h2>
          <p className="text-gray-500 mb-12">Tệp ZIP đã được tạo và lưu trữ an toàn trong My Drive của bạn.</p>
          <button onClick={onComplete} className="w-full py-4 bg-primary text-white rounded-2xl font-black">Hoàn tất</button>
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
            <h2 className="font-black text-3xl tracking-tight">Đang nén file...</h2>
            <p className="text-xs text-primary font-black uppercase tracking-widest mt-1">Tiến độ: {progress}%</p>
          </div>
        </div>
        
        <div className="space-y-12">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{status}</p>
            <div className="w-full h-6 bg-gray-100 dark:bg-gray-800 rounded-full p-2">
              <div className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(19,127,236,0.4)]" style={{ width: `${progress}%` }} />
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-3xl p-8 flex items-center gap-8 border border-gray-100 dark:border-white/5">
            <span className="material-symbols-outlined text-3xl text-primary/60">description</span>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Đang nạp</p>
              <p className="text-base font-black truncate text-slate-700 dark:text-zinc-200">{currentFile}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompressionProgress;
