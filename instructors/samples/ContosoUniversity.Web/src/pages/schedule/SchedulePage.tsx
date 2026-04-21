import { useEffect, useState, useCallback, useMemo } from "react";
import CourseSidebar from "./CourseSidebar";
import CalendarGrid from "./CalendarGrid";
import FilterBar, { type FilterState } from "./FilterBar";
import DepartmentLegend from "@/components/DepartmentLegend";
import { useTheme } from "@/hooks/useTheme";
import {
  getScheduledInstances,
  createScheduledInstance,
  updateScheduledInstance,
  deleteScheduledInstance,
  getConflicts,
} from "@/services/api";
import type { ScheduledInstanceDto, CreateScheduledInstanceDto, UpdateScheduledInstanceDto, ConflictDto } from "@/types";

export default function SchedulePage() {
  const [instances, setInstances] = useState<ScheduledInstanceDto[]>([]);
  const [conflicts, setConflicts] = useState<ConflictDto[]>([]);
  const [filter, setFilter] = useState<FilterState>({ mode: "all" });
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const fetchInstances = useCallback(async () => {
    const data = await getScheduledInstances(filter.studentId, filter.instructorId);
    setInstances(data);
  }, [filter.studentId, filter.instructorId]);

  const fetchConflicts = useCallback(async () => {
    if (filter.mode === "instructor" && filter.instructorId) {
      const data = await getConflicts(filter.instructorId);
      setConflicts(data);
    } else {
      setConflicts([]);
    }
  }, [filter.mode, filter.instructorId]);

  useEffect(() => {
    fetchInstances().catch(console.error);
  }, [fetchInstances]);

  useEffect(() => {
    fetchConflicts().catch(console.error);
  }, [fetchConflicts]);

  const conflictIds = useMemo(() => {
    const ids = new Set<number>();
    for (const c of conflicts) {
      ids.add(c.instanceA.scheduledInstanceId);
      ids.add(c.instanceB.scheduledInstanceId);
    }
    return ids;
  }, [conflicts]);

  const handleCreate = useCallback(async (dto: CreateScheduledInstanceDto): Promise<ScheduledInstanceDto | null> => {
    try {
      const result = await createScheduledInstance(dto);
      setInstances((prev) => [...prev, result]);
      return result;
    } catch {
      return null;
    }
  }, []);

  const handleUpdate = useCallback(async (id: number, dto: UpdateScheduledInstanceDto): Promise<boolean> => {
    try {
      const result = await updateScheduledInstance(id, dto);
      setInstances((prev) => prev.map((i) => (i.scheduledInstanceId === id ? result : i)));
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteScheduledInstance(id);
      setInstances((prev) => prev.filter((i) => i.scheduledInstanceId !== id));
    } catch {
      // ignore
    }
  }, []);

  const handleFilterChange = useCallback((newFilter: FilterState) => {
    setFilter(newFilter);
  }, []);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <FilterBar value={filter} onChange={handleFilterChange} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col">
          <CourseSidebar isDark={isDark} />
          <DepartmentLegend isDark={isDark} />
        </div>
        <CalendarGrid
          instances={instances}
          isDark={isDark}
          conflictIds={conflictIds}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
