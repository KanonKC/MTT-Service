import { CronJob } from "cron";
import BookService from "../services/book/book.service";
import { readdirSync, unlinkSync } from "fs";
import Cache from "../cache";

export default class Cron {
    private readonly cache: Cache;
    private readonly bookService: BookService;

    constructor(bookService: BookService, cache: Cache) {
        this.cache = cache;
        this.bookService = bookService;
    }

    async start(): Promise<void> {
        this.importBookDataFromGoogleDriveCron();
        this.clearCacheCron();
        console.log('Cron started');
    }

    importBookDataFromGoogleDriveCron(): CronJob {
        return CronJob.from({
            cronTime: '0 4 * * *',
            onTick: () => this.bookService.importBookDataFromGoogleDrive(),
            start: true,
            timeZone: 'Asia/Bangkok',
        })
    }

    clearCacheCron(): CronJob {
        return CronJob.from({
            cronTime: '* * * * *',
            onTick: () => this.cache.bulkDeleteExpired(),
            start: true,
            timeZone: 'Asia/Bangkok',
        })
    }
}