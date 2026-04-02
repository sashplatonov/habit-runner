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
    const vapidPublicKey =<REDACTED>
    const vapidPrivateKey =<REDACTED>
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
      if (this.isP2025Error(error)) {
        return;
      }
      this.logger.error(`Failed to delete subscription: ${error}`);
      throw error;
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

    try {
      const habits = await this.prisma.habit.findMany({
        where: {
          reminderEnabled: true,
          reminderTime: { not: null },
          archived: false
        },
        include: {
          user: {
            select: { id: true, timezone: true }
          }
        }
      });

      for (const habit of habits) {
        const tz = habit.user.timezone || 'UTC';
        const currentTimeInTz = this.getTimeInTimezone(now, tz);

        if (habit.reminderTime !== currentTimeInTz) {
          continue;
        }

        // Skip if notification already sent today in user's timezone
        if (habit.lastReminderSentAt) {
          const todayKeyInTz = this.getDateKeyInTimezone(now, tz);
          const lastSentKeyInTz = this.getDateKeyInTimezone(new Date(habit.lastReminderSentAt), tz);
          if (lastSentKeyInTz === todayKeyInTz) {
            continue;
          }
        }

        await this.sendPush(habit.user.id, {
          title: `Reminder: ${habit.name}`,
          body: habit.description || `Time to complete your habit!`
        });

        await this.prisma.habit.update({
          where: { id: habit.id },
          data: { lastReminderSentAt: now }
        });
      }
    } catch (error) {
      this.logger.error(`Cron reminder notification failed: ${error}`);
    }
  }

  private getTimeInTimezone(date: Date, timezone: string): string {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(date);
      const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));
      // hour12:false can return "24" at midnight in some environments
      const hour = partMap.hour === '24' ? '00' : partMap.hour;
      return `${hour.padStart(2, '0')}:${partMap.minute.padStart(2, '0')}`;
    } catch {
      return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
    }
  }

  private getDateKeyInTimezone(date: Date, timezone: string): string {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    } catch {
      return date.toISOString().slice(0, 10);
    }
  }

  getVapidPublicKey(): string {
    const key =<REDACTED>
    if (!key) {
      throw new Error('VAPID_PUBLIC_KEY not configured');
    }
    return key;
  }

  private isP2025Error(error: unknown): error is { code?: string } {
    if (typeof error !== 'object' || error === null) {
      return false;
    }
    const maybeRecord = error as Record<string, unknown>;
    return typeof maybeRecord.code === 'string' && maybeRecord.code === 'P2025';
  }
}
