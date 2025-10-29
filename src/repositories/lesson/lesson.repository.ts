import { Lesson, PrismaClient } from '@prisma/client';
import { CreateLesson, LessonFilterOptions } from './request';

export default class LessonRepository {
    private readonly prisma: PrismaClient;
    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(r: CreateLesson): Promise<Lesson> {
        return this.prisma.lesson.create({
            data: {
                class: r.class,
                subject: r.subject,
                note: r.note,
                book_id: r.bookId,
            },
        });
    }

    async list(f?: LessonFilterOptions): Promise<Lesson[]> {
        return this.prisma.lesson.findMany({
            where: {
                ...(f?.class && { class: f.class }),
                ...(f?.subject && { subject: f.subject }),
                ...(f?.bookId && { book_id: f.bookId }),
                ...(f?.after && { createdAt: { gte: f.after } }),
                ...(f?.before && { createdAt: { lte: f.before } }),
            },
            include: {
                book: true,
            },
        });
    }

    async getBySubjectClass(subject: string, studentClass: number): Promise<Lesson | null> {
        return this.prisma.lesson.findFirst({
            where: {
                subject: subject,
                class: studentClass,
            },
        });
    }
}
