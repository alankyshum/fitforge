import * as Notifications from "expo-notifications";
import { getSchedule, getTemplateById } from "./db";

export async function requestPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getPermissionStatus(): Promise<string> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function scheduleReminders(time: {
  hour: number;
  minute: number;
}): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const entries = await getSchedule();
  if (entries.length === 0) return 0;
  for (const entry of entries) {
    // expo weekday: 1=Sunday..7=Saturday; our day_of_week: 0=Mon..6=Sun
    const weekday = ((entry.day_of_week + 1) % 7) + 1;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to train!",
        body: `${entry.template_name} is scheduled for today`,
        data: { templateId: entry.template_id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: time.hour,
        minute: time.minute,
      },
    });
  }
  return entries.length;
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function handleResponse(
  response: Notifications.NotificationResponse,
  navigate: (path: string, params?: Record<string, string>) => void,
  showSnackbar: (msg: string) => void
): Promise<void> {
  const data = response.notification.request.content.data as
    | Record<string, unknown>
    | undefined;
  const id = data?.templateId;
  if (typeof id !== "string") {
    navigate("/");
    return;
  }
  const tpl = await getTemplateById(id);
  if (!tpl) {
    navigate("/");
    showSnackbar("Scheduled template no longer exists");
    return;
  }
  navigate("/workout/new", { templateId: id });
}

export function setupHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
