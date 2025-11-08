export interface CacheItem<T> {
    value: T;
    expiresAt: number;
}

export enum TTL {
    ONE_MINUTE = 60 * 1000,
    FIVE_MINUTES = 5 * 60 * 1000,
    TEN_MINUTES = 10 * 60 * 1000,
    THIRTY_MINUTES = 30 * 60 * 1000,
    ONE_HOUR = 60 * 60 * 1000,
    ONE_DAY = 24 * 60 * 60 * 1000,
    ONE_WEEK = 7 * 24 * 60 * 60 * 1000,
    ONE_MONTH = 30 * 24 * 60 * 60 * 1000,
    ONE_YEAR = 365 * 24 * 60 * 60 * 1000,
}

export default class Cache {
    public readonly cache: Record<string, CacheItem<any>> = {};
    constructor() {
        this.cache = {};
    }

    get<T>(key: string): T | null {
        if (!this.cache[key]) {
            return null;
        }
        return this.cache[key].value as T;
    }

    set(key: string, value: any, ttl: TTL): void {
        this.cache[key] = {
            value,
            expiresAt: Date.now() + ttl,
        };
    }

    delete(key: string): void {
        delete this.cache[key];
    }

    bulkDeleteExpired(): void {
        Object.keys(this.cache).forEach(key => {
            if (this.cache[key].expiresAt < Date.now()) {
                delete this.cache[key];
            }
        });
    }
}