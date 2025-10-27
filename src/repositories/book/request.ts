export interface CreateBook {
    title: string;
    author: string | null;
    coverImage: string | null;
    googleDriveId: string;
}