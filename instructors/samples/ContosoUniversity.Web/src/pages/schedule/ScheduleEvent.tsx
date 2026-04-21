import { getResolvedColors } from "@/utils/departmentColors";
import type { EventContentArg } from "@fullcalendar/core";

interface ScheduleEventProps {
  eventContent: EventContentArg;
  isDark?: boolean;
  onDelete: (instanceId: number) => void;
  conflictIds?: Set<number>;
}

export default function ScheduleEvent({ eventContent, isDark = false, onDelete, conflictIds }: ScheduleEventProps) {
  const { event } = eventContent;
  const props = event.extendedProps as {
    scheduledInstanceId?: number;
    departmentId?: number;
    departmentName?: string;
    departmentColor?: string | null;
  };

  const colors = getResolvedColors(
    props.departmentId ?? 0,
    props.departmentColor,
    isDark,
  );

  const hasConflict = props.scheduledInstanceId != null && conflictIds?.has(props.scheduledInstanceId);

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded px-1.5 py-1 text-xs leading-tight"
      style={{ backgroundColor: colors.bg, color: colors.text, border: hasConflict ? "2px dashed #ef4444" : "none" }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{event.title}</div>
          {props.departmentName && (
            <div className="truncate opacity-75">{props.departmentName}</div>
          )}
          <div className="opacity-60">
            {eventContent.timeText}
          </div>
        </div>
        {props.scheduledInstanceId != null && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(props.scheduledInstanceId!);
            }}
            className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full opacity-50 transition-opacity hover:opacity-100"
            style={{ backgroundColor: colors.text + "20", color: colors.text }}
            title="Remove"
          >
            ×
          </button>
        )}
      </div>
      {hasConflict && (
        <div className="mt-0.5 text-[10px] font-bold text-red-600">⚠ Conflict</div>
      )}
    </div>
  );
}
