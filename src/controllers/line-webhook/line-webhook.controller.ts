import LINE from '@/externals/line/line';
import { LineEvent, LineWebhookRequest } from '@/externals/line/request';
import { ClassUpdateResponse, CreateLessonResponse, UpdateLessonResponse } from '@/services/lesson/response';
import { FastifyReply, FastifyRequest } from 'fastify';
import { writeFileSync } from 'fs';
import LessonService from '@/services/lesson/lesson.service';
import Cache, { TTL } from '@/cache';
import Gemini from '@/externals/gemini/gemini';
import { Type } from '@google/genai';
import Configuration from '@/configs';
import { Lesson } from '@prisma/client';
import { ExtendedLesson } from '@/repositories/lesson/response';
import LessonRepository from '@/repositories/lesson/lesson.repository';
import { CreateLesson } from '@/repositories/lesson/request';

export default class LineWebhookController {
    private readonly config: Configuration;
    private readonly line: LINE;
    private readonly lessonService: LessonService;
    private readonly cache: Cache
    private readonly gemini: Gemini;
    private readonly lessonRepository: LessonRepository;
    constructor(config: Configuration, line: LINE, lessonService: LessonService, cache: Cache, gemini: Gemini, lessonRepository: LessonRepository) {
        this.config = config;
        this.line = line;
        this.lessonService = lessonService;
        this.cache = cache
        this.gemini = gemini;
        this.lessonRepository = lessonRepository;
    }

    async handleWebhook(req: FastifyRequest<{ Body: LineWebhookRequest }>, res: FastifyReply) {
        const { destination, events } = req.body;
        if (events.length === 0) {
            res.status(200).send(destination).type('text/plain');
        } else {
            const event = events[0];
            if (event.message.type === 'text' && event.message.text?.startsWith('ดู')) {
                this.getLatestLesson(event);
            } else {
                this.updateLesson(event);
            }

            res.status(204);
        }
    }

    async lineDelete(req: FastifyRequest<{ Params: { key: string } }>, res: FastifyReply) {
        if (req.headers['user-agent'] === 'facebookexternalhit/1.1;line-poker/1.0') {
            res.status(204).send();
            return;
        }
        await this.lessonService.deleteByKey(req.params.key);
        res.status(204).send();
    }

    async getLatestLesson(e: LineEvent) {
        const struct = {
            type: Type.OBJECT,
            properties: {
                subject: {
                    type: Type.STRING,
                },
                class: {
                    type: Type.NUMBER,
                },
            },
            required: ['subject', 'class'],
        }

        const prompt = `
        Report the subject and class of the following message:
        "${e.message.text}"
        Here is the following rules for the subject and class:
        - Subject must be one of the following: Math, Chemistry, Physics, Biology, English, Other
        - Class must be number between 0 to 6, 0 for elementary level and 1-6 for middle and high school level based on Thai education system
        `;
        const structMessage = await this.gemini.generateStructuredOutput<ClassUpdateResponse>(prompt, struct);
        const lesson = await this.lessonService.getLatest(structMessage.subject, structMessage.class);
        if (lesson) {
            const date = lesson.created_at.toLocaleString('en-US', { timeZone: this.config.timeZone })
            let replyMessage = `${date}\n${lesson.note}`;
            if (lesson.book) {
                replyMessage += `\nBook: ${lesson.book.title}\n${lesson.book.google_drive_url}`;
            }
            await this.line.replyMessage(e.replyToken, replyMessage);
        } else {
            await this.line.replyMessage(e.replyToken, 'ไม่พบบทเรียนนี้ในระบบ');
        }
    }

    async updateLesson(e: LineEvent) {
        const messageKey = `update-lesson_message_${e.source.userId}`;
        const imageKey = `update-lesson_image_${e.source.userId}`;
        let lesson: CreateLessonResponse | null = null;
        if (e.message.type === 'text') {
            const image = this.cache.get<Buffer>(imageKey);
            if (image) {
                lesson = await this.lessonService.create(e.message.text ?? '', image);
                this.cache.delete(imageKey);
            } else {
                this.cache.set(messageKey, e.message.text ?? '', TTL.ONE_HOUR);
            }
        } else if (e.message.type === 'image') {
            const image = await this.line.getContent(e.message.id);
            const message = this.cache.get<string>(messageKey);
            if (message) {
                lesson = await this.lessonService.create(message, image);
                this.cache.delete(messageKey);
            } else {
                this.cache.set(imageKey, image, TTL.ONE_HOUR);
            }
        }
        if (lesson) {
            let replyMessage = `Class: ${lesson?.class_level}\nSubject: ${lesson?.subject}`;
            if (lesson.book) {
                replyMessage += `\nBook: ${lesson.book.title}\n${lesson.book.google_drive_url}`;
            }
            const deleteUrl = `${this.config.host}/line/delete/lessons/${lesson.key}`;
            replyMessage += `\n\nหากมีข้อผิดพลาดในการบันทึกการสอน สามารถกดที่ลิงก์นี้เพื่อลบและเขียนใหม่ได้: ${deleteUrl}`;
            await this.line.replyMessage(e.replyToken, replyMessage)
        }
    }
}
