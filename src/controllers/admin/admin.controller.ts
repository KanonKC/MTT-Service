import AdminService from "@/services/admin/admin.service";
import { FastifyReply, FastifyRequest } from "fastify";

export default class AdminController {
    private readonly adminService: AdminService;
    constructor(adminService: AdminService) {
        this.adminService = adminService;
    }

    async healthCheck(request: FastifyRequest, response: FastifyReply) {
        const healthCheck = await this.adminService.healthCheck();
        response.status(200).send(healthCheck);
    }
}