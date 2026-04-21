import { useEffect, useState } from "react";
import type { NotificationDto } from "@/types";

interface ToastItem {
  id: number;
  notification: NotificationDto;
}

let nextId = 0;

interface ToastStackProps {
  notifications: NotificationDto[];
}

function Toast({ notification, onClose }: { notification: NotificationDto; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="pointer-events-auto w-80 rounded-md border border-blue-300 bg-white p-4 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-800">
            {notification.entityType} {notification.operation}
          </p>
          <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
        </div>
        <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-600" aria-label="Close">
          &times;
        </button>
      </div>
    </div>
  );
}

export default function ToastStack({ notifications }: ToastStackProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[notifications.length - 1];
    if (!latest) return;
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, notification: latest }]);
  }, [notifications]);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} notification={t.notification} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
