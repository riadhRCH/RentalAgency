import { Response } from 'express';
import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    inbound(body: Record<string, string>, res: Response): Promise<void>;
    completed(body: Record<string, string>): Promise<{
        received: boolean;
    }>;
}
