import Cache, { TTL } from '@/cache';
import Configuration from '@/configs';
import LINE from '@/externals/line/line';
import { LineEvent, LineWebhookRequest } from '@/externals/line/request';
import { ExtendedLesson } from '@/repositories/lesson/response';
import AdminService from '@/services/admin/admin.service';
import LessonService from '@/services/lesson/lesson.service';
import { FastifyReply, FastifyRequest } from 'fastify';

export default class LineWebhookController {
    private readonly config: Configuration;
    private readonly line: LINE;
    private readonly lessonService: LessonService;
    private readonly cache: Cache
    private readonly adminService: AdminService;
    constructor(config: Configuration, line: LINE, lessonService: LessonService, cache: Cache, adminService: AdminService) {
        this.config = config;
        this.line = line;
        this.lessonService = lessonService;
        this.cache = cache
        this.adminService = adminService;
    }

    async handleWebhook(req: FastifyRequest<{ Body: LineWebhookRequest }>, res: FastifyReply) {
        const { destination, events } = req.body;
        if (events.length === 0) {
            res.status(200).send(destination).type('text/plain');
        } else {
            const e = events[0];
            if (e.message.type === 'text' && e.message.text?.startsWith('!')) {
                const command = e.message.text?.split(' ')[0].substring(1);
                switch (command) {
                    case 'hc':
                        this.getHealthCheck(e);
                        break;
                }

            } else if (e.message.type === 'text' && e.message.text?.startsWith('ดู')) {
                this.getLatestLesson(e);
            } else {
                this.updateLesson(e);
            }

            res.status(204);
        }
    }

    async deleteLesson(req: FastifyRequest<{ Params: { key: string } }>, res: FastifyReply) {
        if (req.headers['user-agent'] === 'facebookexternalhit/1.1;line-poker/1.0') {
            // Do nothing, if the request is opened by LINE itself
            res.status(204).send();
            return;
        }
        await this.lessonService.deleteByKey(req.params.key);
        res.status(204).send();
    }

    async getLatestLesson(e: LineEvent) {
        if (!e.message.text) return;
        const detail = await this.lessonService.getLessonDetailFromMessage(e.message.text);
        const lesson = await this.lessonService.getLatest(detail.subject, detail.class);
        if (lesson) {
            const date = lesson.created_at.toLocaleString('en-US', { timeZone: this.config.timeZone })
            let replyMessage = `[${date}]\n🏫 Class: ${lesson.class_level}\n✏️ Subject: ${lesson.subject}\n\n📃 เนื้อหา:\n${lesson.note}`;
            if (lesson.book) {
                replyMessage += `\n\n📗 Book: ${lesson.book.title}\n${lesson.book.google_drive_url}`;
            }
            await this.line.replyMessage(e.replyToken, replyMessage);
        } else {
            await this.line.replyMessage(e.replyToken, 'ไม่พบบทเรียนนี้ในระบบ');
        }
    }

    async updateLesson(e: LineEvent) {
        const messageKey = `update-lesson_message_${e.source.userId}`;
        const imageKey = `update-lesson_image_${e.source.userId}`;
        let lesson: ExtendedLesson | null = null;
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
            let replyMessage = `🏫 Class: ${lesson?.class_level}\n✏️ Subject: ${lesson?.subject}`;
            if (lesson.book) {
                replyMessage += `\n📗 Book: ${lesson.book.title}\n${lesson.book.google_drive_url}`;
            }
            const deleteUrl = `${this.config.host}/line/delete/lessons/${lesson.key}`;
            replyMessage += `\n\n⚠️ หากมีข้อผิดพลาดในการบันทึกการสอน สามารถกดที่ลิงก์นี้เพื่อลบและเขียนใหม่ได้: ${deleteUrl}`;
            await this.line.replyMessage(e.replyToken, replyMessage)
        }
    }

    async getHealthCheck(e: LineEvent) {
        const healthCheck = await this.adminService.healthCheck();
        let replyMessage = 'Health Check\n\n';
        for (const service of healthCheck.services) {
            replyMessage += `${service.ready ? '✅' : '❌'} ${service.name}\n`;
            if (!service.ready) {
                replyMessage += `${service.message}\n`;
            }
        }
        await this.line.replyMessage(e.replyToken, replyMessage);
    }
}
