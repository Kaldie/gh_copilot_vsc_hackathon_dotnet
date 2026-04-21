import { useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, EventContentArg, EventDropArg } from "@fullcalendar/core";
import type { EventReceiveArg } from "@fullcalendar/interaction";
import ScheduleEvent from "./ScheduleEvent";
import type { ScheduledInstanceDto, CreateScheduledInstanceDto, UpdateScheduledInstanceDto } from "@/types";
import { getResolvedColors } from "@/utils/departmentColors";

interface CalendarGridProps {
  instances: ScheduledInstanceDto[];
  isDark?: boolean;
  conflictIds?: Set<number>;
  onCreate: (dto: CreateScheduledInstanceDto) => Promise<ScheduledInstanceDto | null>;
  onUpdate: (id: number, dto: UpdateScheduledInstanceDto) => Promise<boolean>;
  onDelete: (id: number) => void;
}

/**
 * Build FullCalendar events for every day in the visible range.
 * The data model stores DayOfWeek (recurring weekly), so we project
 * each instance onto every matching day within the visible window.
 */
function buildEvents(
  instances: ScheduledInstanceDto[],
  rangeStart: Date,
  rangeEnd: Date,
  isDark: boolean,
): EventInput[] {
  const events: EventInput[] = [];
  const day = new Date(rangeStart);

  while (day < rangeEnd) {
    const dow = day.getDay();
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, "0");
    const d = String(day.getDate()).padStart(2, "0");

    for (const si of instances) {
      if (si.dayOfWeek !== dow) continue;

      const colors = getResolvedColors(si.departmentId, si.departmentColor, isDark);
      const time = si.startTime.length === 5 ? si.startTime + ":00" : si.startTime;

      // Compute end time from start + duration
      const [hh = 0, mm = 0] = si.startTime.split(":").map(Number);
      const endTotal = hh * 60 + mm + si.durationMinutes;
      const endH = String(Math.floor(endTotal / 60)).padStart(2, "0");
      const endM = String(endTotal % 60).padStart(2, "0");

      events.push({
        id: `${si.scheduledInstanceId}-${y}${m}${d}`,
        title: si.courseTitle,
        start: `${y}-${m}-${d}T${time}`,
        end: `${y}-${m}-${d}T${endH}:${endM}:00`,
        backgroundColor: colors.bg,
        borderColor: colors.text + "40",
        textColor: colors.text,
        extendedProps: {
          scheduledInstanceId: si.scheduledInstanceId,
          courseId: si.courseId,
          courseTitle: si.courseTitle,
          departmentId: si.departmentId,
          departmentName: si.departmentName,
          departmentColor: si.departmentColor,
        },
      });
    }

    day.setDate(day.getDate() + 1);
  }

  return events;
}

export default function CalendarGrid({ instances, isDark = false, conflictIds, onCreate, onUpdate, onDelete }: CalendarGridProps) {
  const calendarRef = useRef<FullCalendar>(null);

  /**
   * FullCalendar calls this function whenever it needs events (initial load,
   * week navigation, or when the function reference changes — i.e. when
   * `instances` is updated after a create/update/delete).
   */
  const fetchEvents = useCallback(
    (
      fetchInfo: { start: Date; end: Date },
      successCallback: (events: EventInput[]) => void,
    ) => {
      successCallback(buildEvents(instances, fetchInfo.start, fetchInfo.end, isDark));
    },
    [instances, isDark],
  );

  const handleEventReceive = useCallback(async (info: EventReceiveArg) => {
    const { event } = info;
    const start = event.start;
    if (!start) { info.revert(); return; }

    const dayOfWeek = start.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { info.revert(); return; }

    const startTime = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}:00`;
    const props = event.extendedProps as { courseId?: number };
    if (!props.courseId) { info.revert(); return; }

    const dto: CreateScheduledInstanceDto = {
      courseId: props.courseId,
      dayOfWeek,
      startTime,
      durationMinutes: 60,
    };

    // Remove the externally-dropped placeholder immediately.
    // Once onCreate completes the state update, the `fetchEvents` reference
    // changes (new `instances`), which makes FullCalendar refetch from the
    // function — bringing in the real persisted event.
    event.remove();
    await onCreate(dto);
  }, [onCreate]);

  const handleEventDrop = useCallback(async (info: EventDropArg) => {
    const { event } = info;
    const start = event.start;
    const props = event.extendedProps as { scheduledInstanceId?: number };
    if (!start || props.scheduledInstanceId == null) { info.revert(); return; }

    const dayOfWeek = start.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { info.revert(); return; }

    const startTime = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}:00`;

    const existing = instances.find((i) => i.scheduledInstanceId === props.scheduledInstanceId);
    const dto: UpdateScheduledInstanceDto = {
      dayOfWeek,
      startTime,
      durationMinutes: existing?.durationMinutes ?? 60,
    };

    const ok = await onUpdate(props.scheduledInstanceId, dto);
    if (!ok) info.revert();
  }, [onUpdate, instances]);

  const renderEventContent = useCallback((arg: EventContentArg) => (
    <ScheduleEvent
      eventContent={arg}
      isDark={isDark}
      onDelete={onDelete}
      conflictIds={conflictIds}
    />
  ), [isDark, onDelete, conflictIds]);

  return (
    <div className="flex-1 overflow-auto p-4 dark:bg-gray-900">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "title",
          center: "",
          right: "prev,next today",
        }}
        slotDuration="00:30:00"
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        weekends={true}
        editable={true}
        droppable={true}
        eventReceive={handleEventReceive}
        eventDrop={handleEventDrop}
        eventContent={renderEventContent}
        events={fetchEvents}
        height="100%"
        expandRows={true}
        dayHeaderFormat={{ weekday: "short" }}
        slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: true }}
      />
    </div>
  );
}
