import { Book } from "@prisma/client";
import { ExtendedBook } from "../book/response";

export interface ClassUpdateResponse {
    class: number;
    subject: string;
}

export interface UpdateLessonResponse {
    class: number;
    subject: string;
    book: ExtendedBook | null;
}