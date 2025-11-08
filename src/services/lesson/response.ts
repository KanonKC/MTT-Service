import { Book, Lesson } from "@prisma/client";
import { ExtendedBook } from "../book/response";
import { ExtendedLesson } from "@/repositories/lesson/response";

export interface LessonDetailResponse {
    class: number;
    subject: string;
}

export interface UpdateLessonResponse {
    classLevel: number;
    subject: string;
    book: ExtendedBook | null;
}

export interface LatestLessonResponse extends Lesson {
    book: ExtendedBook | null;
}

export interface CreateLessonResponse {
    key: string;
    book: ExtendedBook | null;
    class_level: number;
    subject: string;
    note: string | null;
}