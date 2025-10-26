import LINE from "@/externals/line/line";
import { LineWebhookRequest } from "@/externals/line/request";
import { FastifyReply, FastifyRequest } from "fastify";

export default class LineController {
    private readonly line: LINE;
    constructor(line: LINE) {
        this.line = line;
    }

    async handleWebhook(req: FastifyRequest<{ Body: LineWebhookRequest }>, res: FastifyReply) {
        const { destination, events } = req.body;
        if (events.length === 0) {
            res.status(200).send(destination).type('text/plain');
        } else {
            await this.line.replyMessage(events[0].replyToken, events[0].message.text?.toUpperCase() || '');
            res.status(204)
        }
    }
}