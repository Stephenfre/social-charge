import { Platform } from 'react-native';
import dayjs from 'dayjs';
import * as Notifications from 'expo-notifications';

const NOTIFICATION_CHANNEL_ID = 'social-charge-events';
const REFUND_CUTOFF_HOURS_BEFORE_START = 2;
const REFUND_CUTOFF_WARNING_MINUTES = 30;
const REVIEW_PROMPT_MINUTES_AFTER_END = 90;
const LOW_CREDIT_THRESHOLD = 0;

type EventNotificationInput = {
  eventId: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  location?: string | null;
};

type CreditNotificationInput = {
  balance: number;
};

const eventNotificationIdentifier = (eventId: string, kind: string) => `event:${eventId}:${kind}`;

const isFuture = (date: dayjs.Dayjs) => date.isAfter(dayjs().add(5, 'second'));

async function ensureNotificationPermissions() {
  const existing = await Notifications.getPermissionsAsync();
  const canNotify =
    existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (canNotify) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return (
    requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'Event reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function scheduleNotification({
  identifier,
  title,
  body,
  date,
  data,
}: {
  identifier: string;
  title: string;
  body: string;
  date: dayjs.Dayjs | null;
  data: Record<string, string | number | boolean | null>;
}) {
  const canNotify = await ensureNotificationPermissions();
  if (!canNotify) {
    return null;
  }

  await ensureNotificationChannel();

  return Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: date
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: date.toDate(),
          channelId: NOTIFICATION_CHANNEL_ID,
        }
      : null,
  });
}

async function cancelScheduledEventNotifications(eventId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((notification) => notification.content.data?.eventId === eventId)
      .map((notification) =>
        Notifications.cancelScheduledNotificationAsync(notification.identifier)
      )
  );
}

export async function scheduleRsvpLocalNotifications({
  eventId,
  title,
  startsAt,
  endsAt,
  location,
}: EventNotificationInput) {
  if (!startsAt) {
    return;
  }

  try {
    await cancelScheduledEventNotifications(eventId);

    const start = dayjs(startsAt);
    const end = endsAt ? dayjs(endsAt) : null;
    const eventTime = start.format('h:mm A');
    const locationLine = location ? ` at ${location}` : '';
    const notificationData = { eventId, eventTitle: title };
    const schedules = [
      {
        identifier: eventNotificationIdentifier(eventId, 'rsvp-confirmed'),
        title: 'RSVP confirmed',
        body: `${title} is on your calendar for ${start.format('ddd, MMM D')} at ${eventTime}.`,
        date: null,
        data: { ...notificationData, type: 'rsvp-confirmed' },
      },
      {
        identifier: eventNotificationIdentifier(eventId, 'two-hour-reminder'),
        title: `${title} starts in 2 hours`,
        body: `Starts at ${eventTime}${locationLine}.`,
        date: start.subtract(2, 'hour'),
        data: { ...notificationData, type: 'two-hour-reminder' },
      },
      {
        identifier: eventNotificationIdentifier(eventId, 'check-in'),
        title: 'Check in when you arrive',
        body: `${title} starts now${locationLine}.`,
        date: start,
        data: { ...notificationData, type: 'check-in' },
      },
      {
        identifier: eventNotificationIdentifier(eventId, 'refund-cutoff'),
        title: 'Refund window closing soon',
        body: `Cancel by ${start.subtract(REFUND_CUTOFF_HOURS_BEFORE_START, 'hour').format('h:mm A')} to get your credits back.`,
        date: start
          .subtract(REFUND_CUTOFF_HOURS_BEFORE_START, 'hour')
          .subtract(REFUND_CUTOFF_WARNING_MINUTES, 'minute'),
        data: { ...notificationData, type: 'refund-cutoff' },
      },
      ...(end
        ? [
            {
              identifier: eventNotificationIdentifier(eventId, 'review-prompt'),
              title: `How was ${title}?`,
              body: 'Share a quick review while it is fresh.',
              date: end.add(REVIEW_PROMPT_MINUTES_AFTER_END, 'minute'),
              data: { ...notificationData, type: 'review-prompt' },
            },
          ]
        : []),
    ];

    await Promise.all(
      schedules
        .filter((schedule) => schedule.date === null || isFuture(schedule.date))
        .map((schedule) => scheduleNotification(schedule))
    );
  } catch (error) {
    console.warn('[notifications] Failed to schedule RSVP notifications', error);
  }
}

export async function cancelEventLocalNotifications(eventId: string) {
  try {
    await cancelScheduledEventNotifications(eventId);
  } catch (error) {
    console.warn('[notifications] Failed to cancel event notifications', error);
  }
}

export async function notifyLowCreditsAfterRsvp({ balance }: CreditNotificationInput) {
  if (balance > LOW_CREDIT_THRESHOLD) {
    return;
  }

  try {
    await scheduleNotification({
      identifier: `credits:low:${Date.now()}`,
      title: "You're out of credits",
      body: 'Add credits to RSVP to future events.',
      date: null,
      data: { type: 'low-credits', balance },
    });
  } catch (error) {
    console.warn('[notifications] Failed to show low credits notification', error);
  }
}

export async function notifyCreditRefund({ amount }: { amount: number }) {
  if (amount <= 0) {
    return;
  }

  try {
    await scheduleNotification({
      identifier: `credits:refund:${Date.now()}`,
      title: 'Credits refunded',
      body: `${amount} ${amount === 1 ? 'credit has' : 'credits have'} been added back to your wallet.`,
      date: null,
      data: { type: 'credit-refund', amount },
    });
  } catch (error) {
    console.warn('[notifications] Failed to show credit refund notification', error);
  }
}
