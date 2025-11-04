import Cache, { TTL } from '@/cache';
import Gemini from '@/externals/gemini/gemini';
import LINE from '@/externals/line/line';
import { LineEvent } from '@/externals/line/request';
import { Type } from '@google/genai';
import BookService from '../book/book.service';
import { ClassUpdateResponse, LatestLessonResponse, UpdateLessonResponse } from './response';
import LessonRepository from '@/repositories/lesson/lesson.repository';
import { ExtendedBook } from '../book/response';
import { Lesson, PrismaClient } from '@prisma/client';
import { ExtendedLesson } from '@/repositories/lesson/response';
import { CreateLesson } from '@/repositories/lesson/request';

export default class LessonService {
    private readonly gemini: Gemini;
    private readonly bookService: BookService;
    private readonly lessonRepository: LessonRepository;
    constructor(gemini: Gemini, bookService: BookService, lessonRepository: LessonRepository) {
        this.gemini = gemini;
        this.bookService = bookService;
        this.lessonRepository = lessonRepository;
    }

    async extendLesson(lesson: Lesson): Promise<ExtendedLesson> {
        let book: ExtendedBook | null = null;
        if (lesson.book_id) {
            book = await this.bookService.get(lesson.book_id);
        }
        return {
            ...lesson,
            book: book ? this.bookService.extendBook(book) : null,
        };
    }

    async create(message: string, image: Buffer): Promise<ExtendedLesson> {

        // Summarize the message to get the class and subject
        const struct = {
            type: Type.OBJECT,
            properties: {
                class: {
                    type: Type.NUMBER,
                },
                subject: {
                    type: Type.STRING,
                },
            },
            propertyOrdering: ['class', 'subject'],
            required: ['class', 'subject'],
        };
        const prompt = `
        Report the class and subject of the following message:
        "${message}"
        Here is the following rules for the class and subject:
        - Class must be number between 0 to 6, 0 for elementary level and 1-6 for middle and high school level based on Thai education system
        - Subject must be one of the following: Math, Chemistry, Physics, Biology, English, Other
        `;
        const lessonRes = await this.gemini.generateStructuredOutput<ClassUpdateResponse>(prompt, struct);

        // Get the book detail from the image
        // const bookDetail = await this.bookService.getDetailByCoverImage(image.toString('base64'), 'image/jpeg');

        // Match the book detail to the book in the database
        // const book = await this.bookService.getByTitle(bookDetail.title);
        const book = await this.bookService.getByMatchingImage(image.toString('base64'), 'image/jpeg');
        console.log('creating lesson with', {
            class_level: lessonRes.class,
            subject: lessonRes.subject,
            note: message,
            bookId: book?.id ?? null,
        });

        // const req: CreateLesson = {
        //     classLevel: lessonRes.class,
        //     subject: lessonRes.subject,
        //     note: message,
        //     bookId: book?.id ?? null,
        // };
        const lesson = await this.lessonRepository.create({
            classLevel: lessonRes.class,
            subject: lessonRes.subject,
            note: message,
            bookId: book?.id ?? null,
        });
        console.log('lesson created', lesson);
        return this.extendLesson(lesson);
    }

    async delete(id: number): Promise<void> {
        await this.lessonRepository.delete(id);
    }

    async get(id: number): Promise<Lesson | null> {
        return this.lessonRepository.get(id);
    }

    async getLatest(subject: string, studentClass: number): Promise<LatestLessonResponse | null> {
        const lesson = await this.lessonRepository.getBySubjectClass(subject, studentClass);
        if (!lesson) {
            return null;
        }
        let book: ExtendedBook | null = null;
        if (lesson?.book_id) {
            book = await this.bookService.get(lesson.book_id);
        }
        return {
            ...lesson,
            book: book,
        };
    }
}
