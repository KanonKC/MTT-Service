import { Book, PrismaClient } from '@prisma/client';
import { CreateBook } from './request';

export default class BookRepository {
    private readonly prisma: PrismaClient;
    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(book: CreateBook): Promise<Book> {
        return this.prisma.book.create({
            data: {
                title: book.title,
                author: book.author,
                cover_image: book.coverImage,
                google_drive_id: book.googleDriveId,
            },
        });
    }

    async get(id: number): Promise<Book | null> {
        return this.prisma.book.findUnique({
            where: {
                id: id,
            },
        });
    }

    async list(): Promise<Book[]> {
        return this.prisma.book.findMany();
    }

    async getByTitle(title: string): Promise<Book | null> {
        return this.prisma.book.findFirst({
            where: {
                title: title,
            },
        });
    }
}
