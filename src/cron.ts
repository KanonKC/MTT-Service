import { CronJob } from "cron";
import BookService from "./services/book/book.service";
import { readdirSync, unlinkSync } from "fs";
import Cache from "./cache";

export default class Cron {
    private readonly cache: Cache;
    private readonly bookService: BookService;

    constructor(bookService: BookService, cache: Cache) {
        this.cache = cache;
        this.bookService = bookService;
        console.log('Cron initialized');
        console.log('Cache initialized', this.cache);
    }

    async start(): Promise<void> {
        const c1 = this.importBookDataFromGoogleDriveCron();
        const c2 = this.clearCacheCron();

        console.log('Cron started');
        console.log(`Import book data from Google Drive cron: ${c1.nextDates()}`);
        console.log(`Clear cache cron: ${c2.nextDates()}`);
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