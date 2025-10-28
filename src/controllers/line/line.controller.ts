import LINE from "@/externals/line/line";
import { LineWebhookRequest } from "@/externals/line/request";
import { UpdateLessonResponse } from "@/services/lesson/response";
import { FastifyReply, FastifyRequest } from "fastify";
import { writeFileSync } from "fs";
import LessonService from "@/services/lesson/lesson.service";

export default class LineController {
    private readonly line: LINE;
    private readonly lessonService: LessonService;
    constructor(line: LINE, lessonService: LessonService) {
        this.line = line;
        this.lessonService = lessonService;
    }

    async handleWebhook(req: FastifyRequest<{ Body: LineWebhookRequest }>, res: FastifyReply) {
        const { destination, events } = req.body;
        if (events.length === 0) {
            res.status(200).send(destination).type('text/plain');
        } else {
            const event = events[0];
            const lesson = await this.lessonService.updateByLineMessage(event);
            if (lesson) {
                const replyMessage =  this.lessonService.generateReplyMessage(lesson);
                await this.line.replyMessage(event.replyToken, replyMessage);
            }
            res.status(204)
        }
    }
}