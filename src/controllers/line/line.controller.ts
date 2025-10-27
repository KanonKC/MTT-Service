import LINE from "@/externals/line/line";
import { LineWebhookRequest } from "@/externals/line/request";
import { UpdateLessonResponse } from "@/services/schedule/response";
import ScheduleService from "@/services/schedule/schedule.service";
import { FastifyReply, FastifyRequest } from "fastify";
import { writeFileSync } from "fs";

export default class LineController {
    private readonly line: LINE;
    private readonly scheduleService: ScheduleService;
    constructor(line: LINE, scheduleService: ScheduleService) {
        this.line = line;
        this.scheduleService = scheduleService;
    }

    async handleWebhook(req: FastifyRequest<{ Body: LineWebhookRequest }>, res: FastifyReply) {
        const { destination, events } = req.body;
        if (events.length === 0) {
            res.status(200).send(destination).type('text/plain');
        } else {
            const event = events[0];
            let lessonResponse: UpdateLessonResponse | null = null;
            if (event.message.type === 'image') {
                lessonResponse = await this.scheduleService.cacheLineLessonImage(event);
            } else if (event.message.type === 'text' && event.message.text) {
                lessonResponse = await this.scheduleService.cacheLineLessonMessage(event);
            }
            
            console.log('lessonResponse', lessonResponse);
            if (lessonResponse) {
                let replyMessage = `Class: ${lessonResponse?.class}\nSubject: ${lessonResponse?.subject}`;
                if (lessonResponse.book) {
                    replyMessage += `\nBook: ${lessonResponse.book.google_drive_url}`;
                }
                await this.line.replyMessage(event.replyToken, replyMessage);
            }
            // await this.scheduleService.updateByMessage(event.message.text || '');
            res.status(204)
        }
    }
}