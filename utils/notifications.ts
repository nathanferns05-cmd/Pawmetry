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

export async function scheduleMedicationReminder(
  medicationName: string,
  dosage: string,
  hour: number,
  minute: number
) {
  const Notifications = await getNotifications();

  if (!Notifications) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Pawmetry Medication Reminder",
      body: `${medicationName} • ${dosage}`,
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: "medication-reminders",
    },
  });
}