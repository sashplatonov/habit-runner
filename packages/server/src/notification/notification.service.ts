import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as webPush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface WebPushError extends Error {
  statusCode?: number;
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@habbit-runner.app';

    if (vapidPublicKey && vapidPrivateKey) {
      webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      this.logger.log('Web Push VAPID details configured');
    } else {
      this.logger.warn('Web Push VAPID keys not configured - push notifications will not work');
    }
  }

  async subscribe(userId: string, subscription: PushSubscriptionJSON): Promise<void> {
    try {
      await this.prisma.pushSubscription.upsert({
        where: { endpoint: subscription.endpoint },
        update: {},
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys?.p256dh || '',
          auth: subscription.keys?.auth || ''
        }
      });
    } catch (error) {
      this.logger.error(`Failed to save subscription: ${error}`);
      throw error;
    }
  }

  async unsubscribe(endpoint: string): Promise<void> {
    try {
      await this.prisma.pushSubscription.delete({
        where: { endpoint }
      });
    } catch (error) {
      // Ignore not found errors
      if ((error as any).code !== 'P2025') {
        this.logger.error(`Failed to delete subscription: ${error}`);
        throw error;
      }
    }
  }

  async sendPush(userId: string, payload: { title: string; body: string }): Promise<void> {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId }
    });

    const failedEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          JSON.stringify(payload)
        );
      } catch (error) {
        const err = error as WebPushError;
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription no longer valid
          failedEndpoints.push(sub.endpoint);
        } else {
          this.logger.error(`Failed to send push to ${sub.endpoint}: ${error}`);
        }
      }
    }

    // Clean up invalid subscriptions
    if (failedEndpoints.length > 0) {
      await this.prisma.pushSubscription.deleteMany({
        where: {
          endpoint: { in: failedEndpoints }
        }
      });
    }
  }

  @Cron('* * * * *')
  async sendReminderNotifications(): Promise<void> {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    try {
      const habits = await this.prisma.habit.findMany({
        where: {
          reminderEnabled: true,
          reminderTime: currentTime,
          archived: false
        },
        include: {
          user: true
        }
      });

      for (const habit of habits) {
        // Skip if notification already sent today
        if (habit.lastReminderSentAt && new Date(habit.lastReminderSentAt) >= today) {
          continue;
        }

        await this.sendPush(habit.user.id, {
          title: `Reminder: ${habit.name}`,
          body: habit.description || `Time to complete your habit!`
        });

        // Mark as sent
        await this.prisma.habit.update({
          where: { id: habit.id },
          data: { lastReminderSentAt: now }
        });
      }
    } catch (error) {
      this.logger.error(`Cron reminder notification failed: ${error}`);
    }
  }

  getVapidPublicKey(): string {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) {
      throw new Error('VAPID_PUBLIC_KEY not configured');
    }
    return key;
  }
}
