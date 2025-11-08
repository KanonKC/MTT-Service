export interface HealthCheckResponse {
    services: {
        name: string;
        ready: boolean;
        message: string;
    }[]
    timestamp: string;
}

export interface HealthStatus {
    ready: boolean;
    message: string;
}