import { Book } from "@prisma/client";

export interface BookDetail {
    title: string;
    author: string | null;
}

export interface ExtendedBook extends Book {
    google_drive_url: string;
}