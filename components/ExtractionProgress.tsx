
// ExtractionProgress.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

// Declare gapi as global constant
declare const gapi: any;

import React, { useEffect, useState } from "react";
import * as fflate from 'fflate';
import { ExtractionConfig } from "./DestinationPicker";

interface ExtractionProgressProps {
  archiveId: string;
  config: ExtractionConfig;
  accessToken: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

type UnzippedMap = Record<string, Uint8Array>;

const supportsAllDrives = true;

function stripZipExtension(name: string) {
  return name.replace(/\.[^/.]+$/, "");
}

function isUnsafePath(p: string) {
  if (!p) return true;
  if (p.includes("..")) return true;
  if (p.startsWith("/") || p.startsWith("\\")) return true;
  if (p.includes("\\") || p.includes("\0")) return true;
  return false;
}

async function uploadMultipartRelated(
  accessToken: string,
  parentFolderId: string,
  fileName: string,
  fileBytes: Uint8Array,
  mimeType = "application/octet-stream"
) {
  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    parents: [parentFolderId],
  };

  const encoder = new TextEncoder();
  const metaPart = encoder.encode(
    delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata)
  );

  const fileHeaderPart = encoder.encode(
    delimiter + `Content-Type: ${mimeType}\r\n\r\n`
  );

  const closePart = encoder.encode(closeDelimiter);

  const totalLen =
    metaPart.byteLength +
    fileHeaderPart.byteLength +
    fileBytes.byteLength +
    closePart.byteLength;

  const body = new Uint8Array(totalLen);
  let offset = 0;
  body.set(metaPart, offset);
  offset += metaPart.byteLength;

  body.set(fileHeaderPart, offset);
  offset += fileHeaderPart.byteLength;

  body.set(fileBytes, offset);
  offset += fileBytes.byteLength;

  body.set(closePart, offset);

  const url = new URL("https://www.googleapis.com/upload/drive/v3/files");
  url.searchParams.set("uploadType", "multipart");
  url.searchParams.set("supportsAllDrives", "true");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${errText}`);
  }

  return res.json();
}

const folderCache = new Map<string, string>();

async function ensureFolder(parentId: string, folderName: string): Promise<string> {
  const key = `${parentId}:${folderName}`;
  const cached = folderCache.get(key);
  if (cached) return cached;

  const safeName = folderName.replace(/'/g, "\\'");

  const q = [
    `'${parentId}' in parents`,
    `name='${safeName}'`,
    `mimeType='application/vnd.google-apps.folder'`,
    "trashed=false",
  ].join(" and ");

  const list = await gapi.client.drive.files.list({
    q,
    fields: "files(id,name)",
    supportsAllDrives,
    includeItemsFromAllDrives: supportsAllDrives,
  });

  const existed = list.result.files?.[0];
  if (existed?.id) {
    folderCache.set(key, existed.id);
    return existed.id;
  }

  const created = await gapi.client.drive.files.create({
    resource: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
    supportsAllDrives,
  });

  const id = created.result.id;
  folderCache.set(key, id);
  return id;
}

async function ensureFolderPath(rootFolderId: string, dirPath: string): Promise<string> {
  if (!dirPath) return rootFolderId;

  const parts = dirPath.split("/").filter(Boolean);
  let current = rootFolderId;

  for (const p of parts) {
    current = await ensureFolder(current, p);
  }

  return current;
}

const ExtractionProgress: React.FC<ExtractionProgressProps> = ({
  archiveId,
  config,
  accessToken,
  onComplete,
  onCancel,
}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");
  const [currentFile, setCurrentFile] = useState("Preparing...");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fail = (msg: string, err?: unknown) => {
      console.error(msg, err);
      if (isMounted) setIsError(msg);
    };

    const performExtraction = async () => {
      if (!accessToken || !archiveId || !config) return;

      try {
        if (isMounted) setStatus("Downloading archive from Drive...");
        const zipResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${archiveId}?alt=media&supportsAllDrives=true`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!zipResponse.ok) {
          const t = await zipResponse.text().catch(() => "");
          throw new Error(`Download error (${zipResponse.status}): ${t}`);
        }

        const arrayBuffer = await zipResponse.arrayBuffer();
        if (isMounted) setProgress(15);

        if (isMounted) setStatus("Extracting data...");
        const uint8 = new Uint8Array(arrayBuffer);

        const unzipped: UnzippedMap = fflate.unzipSync(uint8);
        const allPaths = Object.keys(unzipped)
          .filter((p) => !!p)
          .filter((p) => !isUnsafePath(p));

        const filePaths = allPaths.filter((p) => !p.endsWith("/"));
        const totalFiles = filePaths.length;

        if (!totalFiles) {
          throw new Error("No valid files found in the archive.");
        }

        if (isMounted) setProgress(30);

        let targetFolderId = config.destinationFolderId;

        if (config.createSubfolder) {
          if (isMounted) setStatus("Creating new folder...");

          const meta = await gapi.client.drive.files.get({
            fileId: archiveId,
            fields: "name",
            supportsAllDrives,
          });

          const subfolderName = stripZipExtension(meta.result.name || "extracted");
          const folderResponse = await gapi.client.drive.files.create({
            resource: {
              name: subfolderName,
              mimeType: "application/vnd.google-apps.folder",
              parents: [config.destinationFolderId],
            },
            fields: "id",
            supportsAllDrives,
          });

          targetFolderId = folderResponse.result.id;
        }

        if (isMounted) setStatus("Uploading to Drive...");

        for (let i = 0; i < totalFiles; i++) {
          if (!isMounted) break;

          const path = filePaths[i];
          const data = unzipped[path];

          if (!data || !(data instanceof Uint8Array)) {
            continue;
          }

          setCurrentFile(path);

          const lastSlash = path.lastIndexOf("/");
          const dirPath = lastSlash > -1 ? path.slice(0, lastSlash) : "";
          const fileName = lastSlash > -1 ? path.slice(lastSlash + 1) : path;

          const parentForThisFile = await ensureFolderPath(targetFolderId, dirPath);

          await uploadMultipartRelated(accessToken, parentForThisFile, fileName, data);

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
        const msg =
          typeof error?.message === "string"
            ? `Extraction or upload failed: ${error.message}`
            : "Extraction or upload failed. Please check your storage quota and permissions.";
        fail(msg, error);
      }
    };

    performExtraction();

    return () => {
      isMounted = false;
    };
  }, [archiveId, config, accessToken]);

  if (isError) {
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl p-10 text-center shadow-2xl">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
          <h2 className="text-2xl font-black mb-3">Operation Error</h2>
          <p className="text-sm text-gray-500 mb-10 leading-relaxed">{isError}</p>
          <button
            onClick={onCancel}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
        <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl p-10 text-center shadow-2xl">
          <span className="material-symbols-outlined text-green-600 text-6xl mb-6 filled animate-bounce">
            check_circle
          </span>
          <h2 className="text-3xl font-black mb-3">Success!</h2>
          <p className="text-gray-500 mb-12">
            Files have been successfully extracted to your Google Drive.
          </p>
          <button
            onClick={onComplete}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black"
          >
            Back to Browser
          </button>
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
            <h2 className="font-black text-3xl">Extracting...</h2>
            <p className="text-xs text-primary font-black uppercase tracking-widest mt-1">
              Progress: {progress}%
            </p>
          </div>
        </div>

        <div className="space-y-12">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              {status}
            </p>
            <div className="w-full h-6 bg-gray-100 dark:bg-gray-800 rounded-full p-2">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-3xl p-8 flex items-center gap-8 border border-gray-100 dark:border-white/5">
            <span className="material-symbols-outlined text-3xl text-primary/60">
              description
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Processing
              </p>
              <p className="text-base font-black truncate">{currentFile}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtractionProgress;
