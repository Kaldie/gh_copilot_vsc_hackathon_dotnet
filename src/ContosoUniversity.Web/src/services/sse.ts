import type { NotificationDto } from "@/types";

type NotificationHandler = (notification: NotificationDto) => void;

let eventSource: EventSource | null = null;
let handler: NotificationHandler | null = null;

export function connectSSE(onNotification: NotificationHandler): void {
  if (eventSource) return;

  handler = onNotification;
  eventSource = new EventSource("/api/notifications/stream");

  eventSource.onmessage = (event) => {
    try {
      const notification: NotificationDto = JSON.parse(event.data);
      handler?.(notification);
    } catch {
      // Ignore malformed events
    }
  };

  eventSource.onerror = () => {
    // EventSource auto-reconnects by default
  };
}

export function disconnectSSE(): void {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    handler = null;
  }
}
