export interface GoogleDriveFileList {
    files: GoogleDriveFile[];
    nextPageToken: string;
}

export interface GoogleDriveFile {
    id: string;
    name: string;
    parents: string[];
}