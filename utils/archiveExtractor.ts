import SevenZipFactory from '7z-wasm';
import * as fflate from 'fflate';

export interface ExtractedFile {
  path: string;
  data: Uint8Array;
}

/**
 * Extract archive using 7z-wasm (supports .zar, .zz, .7z, .rar, etc.)
 */
export async function extractWith7z(data: Uint8Array): Promise<Record<string, Uint8Array>> {
  // Configure WASM file location for browser environments
  const sevenZip = await SevenZipFactory({
    locateFile: (path: string) => {
      // In browser, WASM file should be in node_modules/7z-wasm/
      if (path.endsWith('.wasm')) {
        return new URL(`../node_modules/7z-wasm/${path}`, import.meta.url).href;
      }
      return path;
    }
  });
  const archiveName = 'archive.tmp';
  const extractDir = '/extracted';
  
  // Write archive to virtual file system
  sevenZip.FS.mkdir(extractDir);
  const stream = sevenZip.FS.open(archiveName, 'w+');
  sevenZip.FS.write(stream, data, 0, data.length);
  sevenZip.FS.close(stream);
  
  // Extract all files
  sevenZip.callMain(['x', archiveName, '-o' + extractDir, '-y']);
  
  // Read all extracted files
  const extracted: Record<string, Uint8Array> = {};
  
  const readDir = (dir: string, basePath: string = '') => {
    const files = sevenZip.FS.readdir(dir);
    
    for (const file of files) {
      if (file === '.' || file === '..') continue;
      
      const fullPath = basePath ? `${basePath}/${file}` : file;
      const filePath = `${dir}/${file}`;
      const stat = sevenZip.FS.stat(filePath);
      
      if (sevenZip.FS.isDir(stat.mode)) {
        readDir(filePath, fullPath);
        extracted[fullPath + '/'] = new Uint8Array(0);
      } else {
        const fileData = sevenZip.FS.readFile(filePath, { encoding: 'binary' });
        extracted[fullPath] = fileData;
      }
    }
  };
  
  readDir(extractDir);
  
  return extracted;
}

/**
 * Extract ZIP file using fflate (faster for ZIP files)
 */
export function extractZip(data: Uint8Array): Record<string, Uint8Array> {
  return fflate.unzipSync(data);
}

/**
 * Extract archive - automatically chooses the right extractor
 */
export async function extractArchive(
  data: Uint8Array,
  fileName: string
): Promise<Record<string, Uint8Array>> {
  const fileNameLower = fileName.toLowerCase();
  const isZipFile = fileNameLower.endsWith('.zip');
  
  if (isZipFile) {
    try {
      return extractZip(data);
    } catch (err) {
      // Fallback to 7z if ZIP extraction fails
      console.warn('ZIP extraction failed, trying 7z-wasm:', err);
      return extractWith7z(data);
    }
  } else {
    // Use 7z-wasm for other formats
    return extractWith7z(data);
  }
}
