import { useEffect, useState } from "react";
import { api } from "@/services/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { NotificationDto } from "@/types";

export default function NotificationList({ onMarkRead }: { onMarkRead?: () => void }) {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    api
      .get<NotificationDto[]>("/notifications")
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.put<NotificationDto>(`/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      onMarkRead?.();
    } catch {
      console.error("Failed to mark as read");
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h1>
      {loading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No notifications yet.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.notificationId}
              className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                n.isRead
                  ? "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                  : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-semibold"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {n.entityType} — {n.operation}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-normal">{n.message}</p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markAsRead(n.notificationId)}
                  className="ml-4 shrink-0 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
