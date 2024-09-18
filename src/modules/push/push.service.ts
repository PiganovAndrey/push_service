import admin from '../../config/firebase';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DatabaseService } from '../database/database.service';
import { notifications } from '@prisma/client';
import { CreatePushDto } from './dto/create-push.dto';
import { UpdatePushDto } from './dto/update-push.dto';
import { SuccessResponse } from 'src/common/interfaces/success.response';

@Injectable()
export class PushService {
    constructor(
        private readonly prisma: DatabaseService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService
    ) {}

    async getAllNotifications(): Promise<notifications[]> {
        this.logger.log('Fetching all notifications');
        try {
            const notifications = await this.prisma.notifications.findMany({ take: 100 });
            this.logger.log(`Fetched ${notifications.length} notifications`);
            return notifications;
        } catch (e) {
            this.logger.error('Error fetching all notifications', e);
            throw e;
        }
    }

    async getUserNotifications(user_uid: string): Promise<notifications[]> {
        this.logger.log(`Fetching notifications for user ${user_uid}`);
        try {
            const notifications = await this.prisma.notifications.findMany({
                where: {
                    user_uid
                }
            });
            this.logger.log(`Fetched ${notifications.length} notifications for user ${user_uid}`);
            return notifications;
        } catch (e) {
            this.logger.error(`Error fetching notifications for user ${user_uid}`, e);
            throw e;
        }
    }

    async createNotification(dto: CreatePushDto): Promise<notifications> {
        this.logger.log(`Creating notification for user ${dto.userUid}`);
        try {
            const notification = await this.prisma.notifications.create({
                data: {
                    user_uid: dto.userUid,
                    title: dto.title,
                    message: dto.message,
                    deviceToken: dto.deviceToken
                }
            });
            this.logger.log(`Created notification with ID ${notification.id} for user ${dto.userUid}`);
            await this.sendPushNotification(notification.title, notification.message, notification.deviceToken);
            return notification;
        } catch (e) {
            this.logger.error('Error creating notification', e);
            throw e;
        }
    }

    async getNotificationById(id: string): Promise<notifications> {
        this.logger.log(`Fetching notification by ID ${id}`);
        try {
            const notification = await this.prisma.notifications.findFirst({
                where: {
                    id
                }
            });
            if (notification) {
                this.logger.log(`Fetched notification with ID ${id}`);
            } else {
                this.logger.warn(`Notification with ID ${id} not found`);
            }
            return notification;
        } catch (e) {
            this.logger.error(`Error fetching notification by ID ${id}`, e);
            throw e;
        }
    }

    async updateNotificationById(id: string, dto: UpdatePushDto): Promise<notifications> {
        this.logger.log(`Updating notification with ID ${id}`);
        try {
            const notification = await this.prisma.notifications.update({
                where: {
                    id
                },
                data: {
                    ...dto
                }
            });
            this.logger.log(`Updated notification with ID ${id}`);
            return notification;
        } catch (e) {
            this.logger.error(`Error updating notification by ID ${id}`, e);
            throw e;
        }
    }

    async deleteNotificationById(id: string): Promise<SuccessResponse> {
        this.logger.log(`Deleting notification with ID ${id}`);
        try {
            await this.prisma.notifications.delete({
                where: {
                    id
                }
            });
            this.logger.log(`Deleted notification with ID ${id}`);
            return { success: true };
        } catch (e) {
            this.logger.error(`Error deleting notification by ID ${id}`, e);
            throw e;
        }
    }

    async markIsViewById(id: string): Promise<SuccessResponse> {
        this.logger.log(`Marking notification as viewed with ID ${id}`);
        try {
            await this.prisma.notifications.update({
                where: {
                    id
                },
                data: {
                    isView: true
                }
            });
            this.logger.log(`Marked notification as viewed with ID ${id}`);
            return { success: true };
        } catch (e) {
            this.logger.error(`Error marking notification as viewed with ID ${id}`, e);
            throw e;
        }
    }

    private async sendPushNotification(title: string, message: string, deviceToken: string): Promise<void> {
        const messagePayload = {
            notification: {
                title: title,
                body: message
            },
            token: deviceToken
        };

        this.logger.log(`Sending push notification to device token ${deviceToken}`);
        try {
            const response = await admin.messaging().send(messagePayload);
            this.logger.log(`Successfully sent message: ${response}`);
        } catch (error) {
            this.logger.error('Error sending message', error);
        }
    }
}
