import { ExtendedBook } from "@/services/book/response";
import { Book, Lesson } from "@prisma/client";

export interface ExtendedLesson extends Lesson {
    book: ExtendedBook | null;
}