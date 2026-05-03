import { Controller, Get, Post, Patch, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notifications.service';
import { NotificationType } from '../schemas/notification.schema';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationService) {}

  @Get()
  findAll(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.notificationsService.getNotifications(
      req.user._id.toString(),
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user._id.toString());
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user._id.toString());
  }

  @Patch('read-all')
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user._id.toString());
  }

  // Internal endpoint for triggering notifications
  @Post('send')
  sendNotification(
    @Query('personnelId') personnelId: string,
    @Query('type') type: NotificationType,
    @Query('title') title: string,
    @Query('message') message: string,
    @Query('link') link?: string,
  ) {
    return this.notificationsService.sendNotification(
      personnelId,
      type,
      title,
      message,
      link,
    );
  }
}
