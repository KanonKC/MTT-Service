import { Book, Lesson } from "@prisma/client";
import { ExtendedBook } from "../book/response";
import { ExtendedLesson } from "@/repositories/lesson/response";

export interface ClassUpdateResponse {
    class: number;
    subject: string;
}

export interface UpdateLessonResponse {
    class: number;
    subject: string;
    book: ExtendedBook | null;
}

export interface LatestLessonResponse extends Lesson {
    book: ExtendedBook | null;
}