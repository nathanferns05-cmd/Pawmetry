import Constants from "expo-constants";

async function getNotifications() {
  // Expo Go does not support the notification functionality
  // Pawmetry needs, so do not load expo-notifications there.
  if (Constants.executionEnvironment === "storeClient") {
    return null;
  }

  try {
    const Notifications = await import("expo-notifications");
    return Notifications;
  } catch (error) {
    console.log("Notifications unavailable:", error);
    return null;
  }
}

export async function setupNotifications() {
  const Notifications = await getNotifications();

  // Running in Expo Go
  if (!Notifications) {
    return false;
  }

  try {
    const existingPermissions =
      await Notifications.getPermissionsAsync();

    if (existingPermissions.status === "granted") {
      if (Constants.platform?.android) {
        await Notifications.setNotificationChannelAsync(
          "medication-reminders",
          {
            name: "Medication Reminders",
            importance: Notifications.AndroidImportance.HIGH,
            sound: "default",
          }
        );
      }

      return true;
    }

    const { status } =
      await Notifications.requestPermissionsAsync();

    if (status !== "granted") {
      return false;
    }

    if (Constants.platform?.android) {
      await Notifications.setNotificationChannelAsync(
        "medication-reminders",
        {
          name: "Medication Reminders",
          importance: Notifications.AndroidImportance.HIGH,
          sound: "default",
        }
      );
    }

    return true;
  } catch (error) {
    console.log("Notification setup failed:", error);
    return false;
  }
}

// Doses per day for each frequency option. "As needed" has no reminders.
const DOSES_PER_DAY: Record<string, number> = {
  "Once a day": 1,
  "Twice a day": 2,
  "Three times a day": 3,
};

// iOS keeps at most 64 pending notifications per app, so a single
// medication never schedules more than this many one-off reminders.
const MAX_DATED_REMINDERS = 48;

type DoseTime = { hour: number; minute: number };

// Spreads the doses evenly across the day, starting at the chosen time.
export function getDoseTimes(
  frequency: string,
  hour: number,
  minute: number
): DoseTime[] {
  const doses = DOSES_PER_DAY[frequency] ?? 0;
  const interval = doses > 0 ? 24 / doses : 0;

  return Array.from({ length: doses }, (_, index) => ({
    hour: (hour + index * interval) % 24,
    minute,
  }));
}

export async function scheduleMedicationReminders(options: {
  medicationName: string;
  dosage: string;
  frequency: string;
  hour: number;
  minute: number;
  startDate: Date;
  endDate: Date;
}) {
  const Notifications = await getNotifications();

  if (!Notifications) {
    return [];
  }

  const doseTimes = getDoseTimes(
    options.frequency,
    options.hour,
    options.minute
  );

  if (doseTimes.length === 0) {
    return [];
  }

  const content = {
    title: "Pawmetry Medication Reminder",
    body: `${options.medicationName} • ${options.dosage}`,
    sound: "default",
  };

  // Every dose between the start date and the end of the end date.
  const now = new Date();
  const lastDay = new Date(options.endDate);
  lastDay.setHours(23, 59, 59, 999);

  const doseDates: Date[] = [];
  const day = new Date(options.startDate);
  day.setHours(0, 0, 0, 0);

  while (day <= lastDay && doseDates.length <= MAX_DATED_REMINDERS) {
    for (const doseTime of doseTimes) {
      const doseDate = new Date(day);
      doseDate.setHours(doseTime.hour, doseTime.minute, 0, 0);

      if (doseDate > now && doseDate <= lastDay) {
        doseDates.push(doseDate);
      }
    }

    day.setDate(day.getDate() + 1);
  }

  const ids: string[] = [];

  if (doseDates.length <= MAX_DATED_REMINDERS) {
    // Short course: one reminder per dose, so they stop on the end date.
    for (const date of doseDates) {
      ids.push(
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date,
            channelId: "medication-reminders",
          },
        })
      );
    }

    return ids;
  }

  // Long course: repeat daily. These are cancelled once the end date
  // has passed (see cancelEndedMedicationReminders).
  for (const doseTime of doseTimes) {
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: doseTime.hour,
          minute: doseTime.minute,
          channelId: "medication-reminders",
        },
      })
    );
  }

  return ids;
}

export async function cancelMedicationReminders(
  notificationIds: string[] | undefined
) {
  const Notifications = await getNotifications();

  if (!Notifications || !notificationIds?.length) {
    return;
  }

  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.log("Unable to cancel reminder:", error);
    }
  }
}

// Stops repeating reminders for medications whose end date has passed.
export async function cancelEndedMedicationReminders(
  medications: { endDate?: string; notificationIds?: string[] }[]
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const medication of medications) {
    if (!medication.endDate || !medication.notificationIds?.length) {
      continue;
    }

    if (new Date(medication.endDate) < today) {
      await cancelMedicationReminders(medication.notificationIds);
    }
  }
}