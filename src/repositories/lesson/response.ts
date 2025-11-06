import { Book, Lesson } from "@prisma/client";

export interface ExtendedLesson extends Lesson {
    book: Book | null;
}