
// Declare gapi and fflate as global constants
declare const gapi: any;

import React, { useState, useEffect } from 'react';
import * as fflate from 'fflate';

interface CompressionProgressProps {
  fileIds: string[];
  destinationFolderId: string;
  zipFileName: string;
  accessToken: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

const CompressionProgress: React.FC<CompressionProgressProps> = ({ 
  fileIds, 
  destinationFolderId,
  zipFileName,
  accessToken, 
  onComplete, 
  onCancel 
}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [currentFile, setCurrentFile] = useState('Preparing...');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const performCompression = async () => {
      if (!accessToken || fileIds.length === 0) return;

      try {
        const zipObject: Record<string, Uint8Array> = {};
        
        // Helper to recursively fetch files from folders
        const addItemsToZip = async (ids: string[], currentPath: string = '') => {
          for (const id of ids) {
            if (!isMounted) break;

            const metaRes = await gapi.client.drive.files.get({
              fileId: id,
              fields: 'id, name, mimeType',
              supportsAllDrives: true
            });
            const meta = metaRes.result;
            const fullPath = currentPath ? `${currentPath}/${meta.name}` : meta.name;

            if (meta.mimeType === 'application/vnd.google-apps.folder') {
              if (isMounted) setStatus(`Browsing folder: ${meta.name}...`);
              
              let pageToken;
              const subItems: string[] = [];
              do {
                const listRes = await gapi.client.drive.files.list({
                  q: `'${meta.id}' in parents and trashed = false`,
                  fields: 'nextPageToken, files(id)',
                  pageToken,
                  supportsAllDrives: true,
                  includeItemsFromAllDrives: true
                });
                subItems.push(...(listRes.result.files?.map((f: any) => f.id) || []));
                pageToken = listRes.result.nextPageToken;
              } while (pageToken);

              await addItemsToZip(subItems, fullPath);
            } else {
              if (isMounted) {
                setStatus(`Downloading: ${meta.name}...`);
                setCurrentFile(fullPath);
              }
              
              const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              
              if (!downloadRes.ok) {
                console.warn(`Failed to download item: ${meta.name}`);
                continue;
              }
              
              const buffer = await downloadRes.arrayBuffer();
              zipObject[fullPath] = new Uint8Array(buffer);
            }
          }
        };

        if (isMounted) setStatus('Discovering and downloading files...');
        await addItemsToZip(fileIds);
        
        if (Object.keys(zipObject).length === 0) {
          throw new Error('No files found to compress.');
        }

        if (isMounted) {
          setProgress(70);
          setStatus('Compressing data...');
        }
        
        const zippedData = fflate.zipSync(zipObject, { level: 6 });
        
        if (isMounted) {
          setProgress(90);
          setStatus(`Saving "${zipFileName}" to Drive...`);
        }

        const metadata = { 
          name: zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`, 
          mimeType: 'application/zip',
          parents: [destinationFolderId]
        };
        
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

        const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body
        });

        if (!uploadResponse.ok) {
          const errText = await uploadResponse.text();
          throw new Error(`Failed to upload ZIP archive: ${errText}`);
        }

        if (isMounted) {
          setProgress(100);
          setIsSuccess(true);
        }
      } catch (error: any) {
        console.error('Compression Error:', error);
        if (isMounted) setIsError(error.message || 'Unknown error occurred during compression.');
      }
    };

    performCompression();
    return () => { isMounted = false; };
  }, [fileIds, destinationFolderId, zipFileName, accessToken]);

  if (isError) {
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl p-10 text-center shadow-2xl">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
          <h2 className="text-2xl font-black mb-3">Compression Failed</h2>
          <p className="text-sm text-gray-500 mb-10 leading-relaxed">{isError}</p>
          <button onClick={onCancel} className="w-full py-4 bg-primary text-white rounded-2xl font-black">Go Back</button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl p-10 text-center shadow-2xl">
          <span className="material-symbols-outlined text-green-600 text-6xl mb-6 filled animate-bounce">check_circle</span>
          <h2 className="text-3xl font-black mb-3">Archive Created!</h2>
          <p className="text-gray-500 mb-12">"{zipFileName}" has been created and saved securely to your chosen Drive location.</p>
          <button onClick={onComplete} className="w-full py-4 bg-primary text-white rounded-2xl font-black">Back to Files</button>
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
            <h2 className="font-black text-3xl tracking-tight">Creating Archive...</h2>
            <p className="text-xs text-primary font-black uppercase tracking-widest mt-1">Progress: {progress}%</p>
          </div>
        </div>
        
        <div className="space-y-12">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{status}</p>
            <div className="w-full h-6 bg-gray-100 dark:bg-gray-800 rounded-full p-2">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(19,127,236,0.4)]" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-3xl p-8 flex items-center gap-8 border border-gray-100 dark:border-white/5">
            <span className="material-symbols-outlined text-3xl text-primary/60">description</span>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Item</p>
              <p className="text-base font-black truncate text-slate-700 dark:text-zinc-200">{currentFile}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompressionProgress;
