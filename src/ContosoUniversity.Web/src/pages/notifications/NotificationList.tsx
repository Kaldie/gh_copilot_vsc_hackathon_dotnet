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
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Notifications</h1>
      {loading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <p className="text-sm text-gray-400">No notifications yet.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.notificationId}
              className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                n.isRead
                  ? "border-gray-100 bg-white"
                  : "border-gray-200 bg-gray-50 font-semibold"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900">
                    {n.entityType} — {n.operation}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 font-normal">{n.message}</p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markAsRead(n.notificationId)}
                  className="ml-4 shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
