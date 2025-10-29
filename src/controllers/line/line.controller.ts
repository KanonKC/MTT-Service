import LINE from '@/externals/line/line';
import { LineEvent, LineWebhookRequest } from '@/externals/line/request';
import { ClassUpdateResponse, UpdateLessonResponse } from '@/services/lesson/response';
import { FastifyReply, FastifyRequest } from 'fastify';
import { writeFileSync } from 'fs';
import LessonService from '@/services/lesson/lesson.service';
import Cache, { TTL } from '@/cache';
import Gemini from '@/externals/gemini/gemini';
import { Type } from '@google/genai';
import Configuration from '@/configs';

export default class LineController {
    private readonly config: Configuration;
    private readonly line: LINE;
    private readonly lessonService: LessonService;
    private readonly cache: Cache
    private readonly gemini: Gemini;
    constructor(config: Configuration, line: LINE, lessonService: LessonService, cache: Cache, gemini: Gemini) {
        this.config = config;
        this.line = line;
        this.lessonService = lessonService;
        this.cache = cache
        this.gemini = gemini;
    }

    async handleWebhook(req: FastifyRequest<{ Body: LineWebhookRequest }>, res: FastifyReply) {
        const { destination, events } = req.body;
        if (events.length === 0) {
            res.status(200).send(destination).type('text/plain');
        } else {
            const event = events[0];
            if (!event.message.text) {
                res.status(204);
                return;
            }

            if (event.message.type === 'text' && event.message.text.startsWith('ดู')) {
                this.getLatestLesson(event);
            } else {
                this.updateLesson(event)
            }

            res.status(204);
        }
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
            const date = lesson.createdAt.toLocaleString('en-US', { timeZone: this.config.timeZone })
            const replyMessage = `${date}\n${lesson.note}\n${lesson.book?.title}\n${lesson.book?.google_drive_url}`;
            await this.line.replyMessage(e.replyToken, replyMessage);
        } else {
            await this.line.replyMessage(e.replyToken, 'ไม่พบบทเรียนนี้ในระบบ');
        }
    }

    async updateLesson(e: LineEvent) {
        const messageKey = `update-lesson_message_${e.source.userId}`;
        const imageKey = `update-lesson_image_${e.source.userId}`;
        let res: UpdateLessonResponse | null = null;
        if (e.message.type === 'text') {
            const image = this.cache.get<Buffer>(imageKey);
            if (image) {
                res = await this.lessonService.update(e.message.text ?? '', image);
                this.cache.delete(imageKey);
            } else {
                this.cache.set(messageKey, e.message.text ?? '', TTL.ONE_HOUR);
            }
        } else if (e.message.type === 'image') {
            const image = await this.line.getContent(e.message.id);
            const message = this.cache.get<string>(messageKey);
            if (message) {
                res = await this.lessonService.update(message, image);
                this.cache.delete(messageKey);
            } else {
                this.cache.set(imageKey, image, TTL.ONE_HOUR);
            }
        }
        if (res) {
            let replyMessage = `Class: ${res?.class}\nSubject: ${res?.subject}`;
            if (res.book) {
                replyMessage += `\nBook: ${res.book.title}\n${res.book.google_drive_url}`;
            }
            await this.line.replyMessage(e.replyToken, replyMessage)
        }
    }
}
