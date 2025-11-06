export interface CreateLesson {
    class: number;
    subject: string;
    note: string | null;
    bookId: number | null;
}

export interface LessonFilterOptions {
    class?: number;
    subject?: string;
    bookId?: number;
    after?: Date;
    before?: Date;
}