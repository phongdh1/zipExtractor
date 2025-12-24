
export enum View {
  LANDING = 'LANDING',
  PICKER = 'PICKER',
  PREVIEW = 'PREVIEW',
  DESTINATION = 'DESTINATION',
  ZIP_DESTINATION = 'ZIP_DESTINATION',
  EXTRACTING = 'EXTRACTING',
  COMPRESSING = 'COMPRESSING'
}

export type FileCategory = 'ZIP' | 'RAR' | '7Z' | 'TAR' | 'FOLDER' | 'PDF' | 'IMAGE' | 'DOC' | 'SHEET' | 'SLIDE' | 'FILE';

export interface DriveFile {
  id: string;
  name: string;
  size: string;
  type: FileCategory;
  mimeType: string;
  lastModified: string;
  color?: string;
  icon?: string;
}

export interface ArchiveContent {
  id: string;
  name: string;
  size: string;
  dateModified: string;
  type: 'folder' | 'image' | 'doc' | 'pdf' | 'text' | 'archive';
  parentId?: string;
  isOpen?: boolean;
}
