
export enum View {
  LANDING = 'LANDING',
  PICKER = 'PICKER',
  PREVIEW = 'PREVIEW',
  DESTINATION = 'DESTINATION',
  EXTRACTING = 'EXTRACTING'
}

export interface DriveFile {
  id: string;
  name: string;
  size: string;
  type: 'ZIP' | 'RAR' | '7Z' | 'FOLDER' | 'FILE';
  lastModified: string;
  color?: string;
}

export interface ArchiveContent {
  id: string;
  name: string;
  size: string;
  dateModified: string;
  type: 'folder' | 'image' | 'doc' | 'pdf' | 'text';
  parentId?: string;
  isOpen?: boolean;
}
