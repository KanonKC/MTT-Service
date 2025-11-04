export interface CreateLesson {
    classLevel: number;
    subject: string;
    note: string | null;
    bookId: number | null;
}

export interface LessonFilterOptions {
    class_level?: number;
    subject?: string;
    bookId?: number;
    after?: Date;
    before?: Date;
}