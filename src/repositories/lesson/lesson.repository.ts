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
                key: r.key,
                class_level: r.classLevel,
                subject: r.subject,
                note: r.note,
                book_id: r.bookId,
            },
        });
    }

    async list(f?: LessonFilterOptions): Promise<Lesson[]> {
        return this.prisma.lesson.findMany({
            where: {
                ...(f?.class_level && { class_level: f.class_level }),
                ...(f?.subject && { subject: f.subject }),
                ...(f?.bookId && { book_id: f.bookId }),
                ...(f?.after && { created_at: { gte: f.after } }),
                ...(f?.before && { created_at: { lte: f.before } }),
            },
            include: {
                book: true,
            },
        });
    }

    async delete(id: number): Promise<void> {
        await this.prisma.lesson.delete({
            where: {
                id: id,
            },
        });
    }

    async deleteByKey(key: string): Promise<void> {
        await this.prisma.lesson.delete({
            where: {
                key: key,
            },
        });
    }

    async get(id: number): Promise<Lesson | null> {
        return this.prisma.lesson.findUnique({
            where: {
                id: id,
            },
        });
    }

    async getBySubjectClass(subject: string, studentClass: number): Promise<Lesson | null> {
        return this.prisma.lesson.findFirst({
            where: {
                subject: subject,
                class_level: studentClass,
            },
            orderBy: {
                created_at: 'desc',
            }
        });
    }

}
